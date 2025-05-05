#!/bin/bash

/home/bkaas/.nvm/versions/node/v23.11.0/bin/node -r /usr/lib/node_modules/dotenv/config \
/home/bkaas/Projects/rosecity-pp/rosecity-pools-backend/utils/statsUpdate.js \
dotenv_config_path=/home/bkaas/Projects/rosecity-pp/rosecity-pools-backend/.env &> \
/home/bkaas/Projects/rosecity-pp/rosecity-pools-backend/utils/updateStats.log
