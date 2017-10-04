
import code
from datetime import datetime
import gc
import logging
import os.path
import signal
import traceback
import tracemalloc
from types import FrameType

from django.conf import settings
from typing import Optional

logger = logging.getLogger('zulip.debug')

# Interactive debugging code from
# http://stackoverflow.com/questions/132058/showing-the-stack-trace-from-a-running-python-application
# (that link also points to code for an interactive remote debugger
# setup, which we might want if we move Tornado to run in a daemon
# rather than via screen).
def interactive_debug(sig, frame):
    # type: (int, FrameType) -> None
    """Interrupt running process, and provide a python prompt for
    interactive debugging."""
    d = {'_frame': frame}      # Allow access to frame object.
    d.update(frame.f_globals)  # Unless shadowed by global
    d.update(frame.f_locals)

    message  = "Signal received : entering python shell.\nTraceback:\n"
    message += ''.join(traceback.format_stack(frame))
    i = code.InteractiveConsole(d)
    i.interact(message)

# SIGUSR1 => Just print the stack
# SIGUSR2 => Print stack + open interactive debugging shell
def interactive_debug_listen():
    # type: () -> None
    signal.signal(signal.SIGUSR1, lambda sig, stack: traceback.print_stack(stack))
    signal.signal(signal.SIGUSR2, interactive_debug)

def tracemalloc_dump(sig, frame):
    # type: (int, FrameType) -> None
    logger.warn("tracemalloc dump: called in pid {}".format(os.getpid()))
    if not tracemalloc.is_tracing():
        logger.warn("tracemalloc dump: tracing off, nothing to dump")
        return
    basename = "snap.{}.{}".format(os.getpid(),
                                   datetime.utcnow().strftime("%F-%T"))
    path = os.path.join(settings.TRACEMALLOC_DUMP_DIR, basename)
    os.makedirs(settings.TRACEMALLOC_DUMP_DIR, exist_ok=True)

    gc.collect()
    tracemalloc.take_snapshot().dump(path)

    procstat = open('/proc/{}/stat'.format(os.getpid()), 'rb').read().split()
    rss_pages = int(procstat[23])
    logger.info("tracemalloc dump: tracing {} MiB ({} MiB peak), using {} MiB; rss {} MiB; dumped {}"
                .format(tracemalloc.get_traced_memory()[0] // 1048576,
                        tracemalloc.get_traced_memory()[1] // 1048576,
                        tracemalloc.get_tracemalloc_memory() // 1048576,
                        rss_pages // 256,
                        basename))

def tracemalloc_listen():
    # type: () -> None
    '''Useful only when tracemalloc tracing enabled.

    See https://docs.python.org/3/library/tracemalloc .
    '''
    assert(signal.SIGRTMIN < signal.SIGRTMAX)
    old_handler = signal.getsignal(signal.SIGRTMIN)
    if old_handler is tracemalloc_dump:
        logger.warn('pid {}: tracemalloc handler all set, allegedly'.format(os.getpid()))
    else:
        logger.warn('pid {}: tracemalloc handler was {}'.format(
            os.getpid(), repr(old_handler)))

    try:
        signal.signal(signal.SIGRTMIN, signal.SIG_IGN)
    except ValueError:
        logger.warn('pid {}: not main thread, aborting listen'.format(os.getpid()))
        return

    handler = signal.getsignal(signal.SIGRTMIN)
    if handler is tracemalloc_dump:
        logger.warn('pid {}: tracemalloc handler set now??'.format(os.getpid()))
    else:
        logger.warn('pid {}: tracemalloc handler un-set: {}'.format(
            os.getpid(), repr(handler)))

    signal.signal(signal.SIGRTMIN, tracemalloc_dump)

    handler = signal.getsignal(signal.SIGRTMIN)
    if handler is tracemalloc_dump:
        logger.warn('pid {}: tracemalloc handler all set now'.format(os.getpid()))
    else:
        logger.warn('pid {}: tracemalloc handler still wrong: {}'.format(
            os.getpid(), repr(handler)))

def maybe_tracemalloc_listen():
    if os.environ.get('PYTHONTRACEMALLOC'):
        # If the server was started with `tracemalloc` tracing on, then
        # listen for a signal to dump `tracemalloc` snapshots.
        tracemalloc_listen()
    else:
        logger.warn('pid {}: no tracemalloc_listen()'.format(os.getpid()))
