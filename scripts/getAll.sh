#!/bin/bash
# Gets hashflag data for entire month
for day in {01..31}; do
    for hour in {00..23}; do
        wget -nc -P "tmp" "https://pbs.twimg.com/hashflag/config-2022-03-$day-$hour.json"
    done
done
