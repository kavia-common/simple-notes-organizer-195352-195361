#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-notes-organizer-195352-195361/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

