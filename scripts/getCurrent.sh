#!/bin/bash
set -x
set -e
wget \
    --no-clobber \
    --directory-prefix="tmp" \
    -o log \
    https://pbs.twimg.com/hashflag/config-$(date -u "+%Y-%m-%d-%H").json
