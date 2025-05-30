#!/bin/bash
cd /home/kavia/workspace/code-generation/weatherwatch-36158-6bf981e4/weatherwatch
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

