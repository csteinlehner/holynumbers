#!/bin/bash
rsync -a --info=progress2 --include=".htaccess" --exclude=".*" --exclude="sync.sh" . cstein@antares.uberspace.de:/var/www/virtual/cstein/holynumbers.csteinlehner.com/ --delete
