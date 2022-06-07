#!/bin/bash
set -x
set -e

# List Images
grep assetUrl data/campaigns.json |
    grep -Eo "(http|https)://[a-zA-Z0-9./?=_%:-]*" |
    sort -u |
    xargs -I {} wget --no-clobber -P img/ {}

# Optimize Images
sudo apt update && sudo apt-get install -y optipng
git ls-files img/ -o | xargs -I {}  optipng -nb -nc {}