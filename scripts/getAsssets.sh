#!/bin/bash
cat data/campaigns.json |
    grep assetUrl |
    grep -Eo "(http|https)://[a-zA-Z0-9./?=_%:-]*" |
    sort -u |
    xargs -I {} wget --no-clobber -P img/ {}
