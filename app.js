var restify = require('restify');
var builder = require('botbuilder');
var apiairecognizer = require('api-ai-recognizer');
var recognizer = new apiairecognizer('f64e1a019de74e61aa7c168a5bb116f2'); 

var connector = new builder.ChatConnector({

});

// Receive messages from the user and respond
var bot = new builder.UniversalBot(connector, {
    persistConversationData: true
});

var intents = new builder.IntentDialog({
    recognizers: [
        recognizer
    ],
    intentThreshold: 0.2,
    recognizeOrder: builder.RecognizeOrder.series
});

bot.dialog('/', intents);

intents.matches('Book Hotel', function (session, args) {
    var fulfillment = builder.EntityRecognizer.findEntity(args.entities, 'fulfillment');

    if (fulfillment) {
        var speech = fulfillment.entity;
        if (speech.indexOf('Booking Details') !== -1) {
            var msg = new builder.Message(session)
                .text("Thank you for expressing interest in our booking Engine. "+ speech +" Please confirm, if we can go ahead with booking")
                .suggestedActions(
                builder.SuggestedActions.create(
                    session, [
                        builder.CardAction.imBack(session, "YES", "Yes"), 
                        builder.CardAction.imBack(session, "NO", "No"),  
                        //builder.CardAction.postBack(session, "YES", "Yes"),  #postBack - doesn't show
                        //builder.CardAction.postBack(session, "NO", "No"), #imBack - show the response                                             
                    ]
                ));

            // we can also save the user data, conversation data
            //https://docs.microsoft.com/en-us/bot-framework/nodejs/bot-builder-nodejs-state
            //save data for conversation
            session.privateConversationData.dataSet = true;
            session.privateConversationData.bdate = builder.EntityRecognizer.findEntity(args.entities, 'date');
            session.privateConversationData.bgeocity = builder.EntityRecognizer.findEntity(args.entities, 'geo-city');
            session.privateConversationData.bhchain = builder.EntityRecognizer.findEntity(args.entities, 'hotel_chains');
            session.privateConversationData.bpeople = builder.EntityRecognizer.findEntity(args.entities, 'number');

            session.send(msg);


        } else {
            session.send(speech);
        }
        
    } else {
        session.send('Sorry...not sure how to respond to that');
    }
});

intents.onDefault(function (session) {
    // We can use this capture response when user is happy with booking ---
    if (session.privateConversationData.dataSet){
        if (session.message.text.match('YES')){
            //session.send("Hurray " + session.message.text + ' date ' + session.privateConversationData.bdate.entity);
            //Let's create a receipt card
            var msg = new builder.ReceiptCard(session)
            .title('Hotel '+ session.privateConversationData.bhchain.entity +' - Booking Receipt')
            .facts([
                builder.Fact.create(session, '12-9034', 'Order Number'),
                builder.Fact.create(session, 'VISA 5555-****', 'Payment Method')
            ])
            .items([
                builder.ReceiptItem.create(session, '$ 38.45', 'Deluxe Room Package')
                    .quantity(session.privateConversationData.bpeople.entity)
                    .image(builder.CardImage.create(session, 'https://github.com/amido/azure-vector-icons/raw/master/renders/traffic-manager.png')) 
            ])
            .tax('$ 7.50')
            .total('$ 90.95')
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/pricing/', 'More Information')
                    .image('https://raw.githubusercontent.com/amido/azure-vector-icons/master/renders/microsoft-azure.png')
            ]);

            session.send(msg);

        }else{
            session.send("You can type your query again or visit www.bkgengine.com for more search options ");    
        }

        //remove data from conversation
        session.privateConversationData = {};
    }else{
        session.send("Sorry...can you please rephrase?");
    }
});


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());
