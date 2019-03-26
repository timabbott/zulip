#!/usr/bin/env python3

# A script to dump messages for the specified number of topics, sent after the
# specified date. This tool is primarily used to obtain dumps of messages for
# improving digest emails. The messages are dumped to a csv file, in the
# following format:
# URL,topic,"First Message","# of messages","# of senders","# of reactions"
# localhost:9991/#narrow/near/30,Scotland3,"Hello world!",7,3,0


import os
import sys

TOOLS_DIR_PATH = os.path.dirname(os.path.abspath(__file__))
ZULIP_PATH = os.path.dirname(TOOLS_DIR_PATH)
sys.path.append(ZULIP_PATH)

os.environ['DJANGO_SETTINGS_MODULE'] = 'zproject.settings'

import django
django.setup()

import argparse
import csv
from datetime import datetime
from typing import Set, Tuple

from zerver.models import Message, Recipient, Reaction, Stream

def fetch_topics(n: int, start_date: datetime) -> Set[Tuple[int, str]]:
    """Find first N topics created after specified start_date."""
    topics = set()
    messages = Message.objects.filter(
        pub_date__gte=start_date,
        recipient__type=Recipient.STREAM
    ).order_by('id').values_list('recipient__type_id', 'subject')
    public_streams = set(
        Stream.objects.filter(invite_only=False, is_in_zephyr_realm=False).values_list('id', flat=True))
    batch_num = 0
    batch_size = 10000
    while True:
        start = batch_num * batch_size
        end = (batch_num + 1) * batch_size
        batch = messages[start:end]
        if len(batch) == 0:
            break
        for stream_id, subject in batch:
            if stream_id not in public_streams:
                continue
            topics.add((stream_id, subject))
            if len(topics) >= n:
                break
        batch_num += 1

    return topics

def get_topic_data(topic: Tuple[int, str], start_date: datetime) -> Tuple[str, str, str, int, int, int]:
    """Get data for a given topic"""
    stream_id, subject = topic
    messages = Message.objects.filter(
        pub_date__gte=start_date,
        recipient__type=Recipient.STREAM,
        recipient__type_id=stream_id,
        subject=subject,
    ).order_by('id').select_related('recipient', 'sender')

    senders = {message.sender_id for message in messages}
    first_message = messages[0]
    message_url = '{}/#narrow/near/{}'.format(first_message.sender.realm.host, first_message.id)
    content = first_message.content[:1000]
    reactions = Reaction.objects.filter(message_id__in=messages)
    return (message_url, subject, content, len(messages), len(senders), len(reactions))


def main() -> None:
    description = ("This script is used for exporting topic data for improving the digest email.")
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "--output-file", dest="output_file_path", type=str, metavar="<path>",
        default=os.path.join("/tmp", "digest_topics.csv"),
        help="Path to the output csv file.")
    parser.add_argument(
        "--num-topics", dest="num_topics", type=int, default=500, help="Number of topics to dump.")
    parser.add_argument(
        "--start-date", dest="start_date", type=lambda d: datetime.strptime(d, '%Y-%m-%d'),
        default=datetime(2017, 3, 1), help="Dump messages after start date -- format YYYY-MM-DD.")

    args = parser.parse_args()
    topics = fetch_topics(args.num_topics, args.start_date)
    output_data = [get_topic_data(topic, args.start_date) for topic in topics]
    with open(args.output_file_path, 'w') as fp:
        writer = csv.writer(fp, dialect='excel')
        writer.writerow(('URL', 'topic', 'First Message', '# of messages', '# of senders', '# of reactions'))
        writer.writerows(output_data)

if __name__ == '__main__':
    main()
