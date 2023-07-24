const { dockStart } = require("@nlpjs/basic");
const fs = require("fs");

const assets = Runtime.getAssets();
const modelAsset = assets["/other/model.nlp"];

const functions = Runtime.getFunctions();
const userFunction = functions.user;
const productFunction = functions.product;
const cartFunction = functions.cart;

const {
  getUserByPhoneNumber,
  createUser,
  updateUser,
} = require(userFunction.path);
const { getProducts, sendProducts } = require(productFunction.path);
const { addItemToCart } = require(cartFunction.path);

const handleMessage = async (context, message, sender, baseURL) => {
  const modelAssetPath = modelAsset.path;

  const dock = await dockStart({
    settings: {
      nlp: {
        modelFileName: "model.private.nlp",
        languages: ["en"],
        forceNER: true,
      },
    },
    use: ["Basic", "BuiltinMicrosoft", "LangEn"],
  });

  const builtin = dock.get("builtin-microsoft");
  const ner = dock.get("ner");
  ner.container.register("extract-builtin-??", builtin, true);
  const nlp = dock.get("nlp");

  if (fs.existsSync(modelAssetPath)) {
    nlp.load(modelAssetPath);
  } else {
    return "could not load model";
  }

  const result = await nlp.process(message);
  const answer = result.intent;

  return answer;
};

exports.handler = async function (context, event, callback) {
  const sender = event.From.replace("whatsapp:", "");
  const incomingMessage = event.Body;
  const baseURL = `https://${event.request.headers.host}`;

  const answer = await handleMessage(context, incomingMessage, sender, baseURL);

  const reply = new Twilio.twiml.MessagingResponse();
  reply.message(answer);

  callback(null, reply);
};
