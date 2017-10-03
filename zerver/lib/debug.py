
import code
from datetime import datetime
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
    if not tracemalloc.is_tracing():
        logger.warn("tracemalloc dump: tracing off, nothing to dump")
        return
    basename = "snap.{}.{}".format(os.getpid(),
                                   datetime.utcnow().strftime("%F-%T"))
    path = os.path.join(settings.TRACEMALLOC_DUMP_DIR, basename)
    os.makedirs(settings.TRACEMALLOC_DUMP_DIR, exist_ok=True)
    tracemalloc.take_snapshot().dump(path)
    logger.info("tracemalloc dump: dumped {}".format(basename))

def tracemalloc_listen():
    # type: () -> None
    '''Useful only when tracemalloc tracing enabled.

    See https://docs.python.org/3/library/tracemalloc .
    '''
    assert(signal.SIGRTMIN < signal.SIGRTMAX)
    signal.signal(signal.SIGRTMIN, tracemalloc_dump)
