To setup the dependencies required for accessBot, ensure you cd to ./Server/ and run the following script:
sudo./setup.sh 

To run the server, environment variables are needed!

Here is a small shell script that sets up said variables

    #!/bin/bash

    # script for starting our accessBot
    clear
    PORT="3000"
    export PORT

    SESSION_SECRET="putyoursupperawesomesecretrighthere"
    export SESSION_SECRET

    MONGODB_URI="mongodb://localhost/makerauth"
    export MONGODB_URI
    
    #password for root, make live one something better than this
    MASTER_PASS="monkey"
    export MASTER_PASS

    # URL for slack webhook intergration (basically auth you need to be a bot)
    SLACK_WEBHOOK_URL="www.putTheWebHookURLHere.com"
    export SLACK_WEBHOOK_URL

    # individual token for slack (in this case we need to act as an adminstrator to invite new members)
    SLACK_TOKEN="putYourTokenHere"
    export SLACK_TOKEN

    # State whether testing application or not
    TESTING_MA=true
    export TESTING_MA

    echo "Starting the accessBot!"
    if $TESTING_MA; then
        nodemon accessBot.js
        # reloads server on source change -> sudo npm install -g nodemon
    else
        npm install
        # probably want to make sure npm install is run when upgrading dorboto
        pm2 start accessBot.js
        # backgrounds process
    fi
    
"nano start.sh" in Sever this folder, add above code with your own parameters, ctrl-x to save, and "chmod +x start.sh"

To start the server run ./start.sh
