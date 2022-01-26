
const express = require('express');
const path = require('path');
var https = require("https");
const urllib = require('urllib');
const session = require('express-session')
const passport = require('passport');
const passportSaml = require('passport-saml');
const useragent = require('useragent');
const decoder = require('saml-encoder-decoder-js');
const parseString = require("xml2js").parseString;
const stripPrefix = require("xml2js").processors.stripPrefix;
const axios = require("axios")

const fs = require('fs');


const app = express(),
    bodyParser = require("body-parser");
port = 3080;

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// SAML strategy for passport -- Single IPD
const strategy = new passportSaml.Strategy(
    {
        entryPoint: "https://alstom-poc-dev.onelogin.com/trust/saml2/http-post/sso/68bd680b-4d5e-4e54-814a-caebee6c4f26",
        issuer: "https://app.onelogin.com/saml/metadata/68bd680b-4d5e-4e54-814a-caebee6c4f26",
        callbackUrl: "https://jamesds.synology.me:3080/login/sso/callback",
        cert: fs.readFileSync("./cert/onelogin.pem", "utf8"),
    },
    (profile, done) => done(null, profile),
    );

passport.use(strategy);


// required for passport
app.use(session({ secret: 'SECRET' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions


app.use(bodyParser.json());


const router = express.Router();

/**
 * This Route Authenticates req with IDP
 * If Session is active it returns saml response
 * If Session is not active it redirects to IDP's login form
 */
router.get('/login/sso',
    passport.authenticate('saml', {
        successRedirect: '/',
        failureRedirect: '/login',
    }));

/**
 * This is the callback URL
 * Once Identity Provider validated the Credentials it will be called with base64 SAML req body
 * Here we used Saml2js to extract user Information from SAML assertion attributes
 * If every thing validated we validates if user email present into user DB.
 * Then creates a session for the user set in cookies and do a redirect to Application
 */

app.post(
    "/login/sso/callback",
    bodyParser.urlencoded({ extended: false }),
    passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
    function (req, res) {

        const xmlResponse = req.body.SAMLResponse;
        decoder.decodeSamlPost(xmlResponse, (err,xmlResponse) => {
          if(err) {
            throw new Error(err);
          } else {
            parseString(xmlResponse, { tagNameProcessors: [stripPrefix] }, function(err, result) {
              if (err) {
                throw err;
              } else {
                console.log(result);
    
                //sign token
                req.session.SAMLResponse =  req.body.SAMLResponse
              }
            });
          }
        });
        res.redirect("/");
    }
);

//= ==========Registering Router==========
app.use('/', router);

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, '../frontend/dist/spa/index.html'));
    }
    else {
        return res.redirect('/login/sso');

    }
});




app.get('/login/fail',
    function (req, res) {
        res.status(401).send('Login failed');
    }
);

app.get('/login.sso/Metadata',
    function (req, res) {
        res.type('application/xml');
        res.status(200).send(strategy.generateServiceProviderMetadata(fs.readFileSync('./cert/onelogin.pem', 'utf8')));
    }
);



app.get("^/api/*", function (req, res, next) {

    const  headers= {  "Content-type": "Application/json", 
        "authorization": `SAML token= ${req.session.SAMLResponse.replace(/\r?\n|\r/g, '')}`}

    var url = 'http://localhost:9002' + req.originalUrl.replace("/api", "/v1")

    axios.get(url, {headers}).then(function (result) {
        // result: {data: buffer, res: response object}
        try {
            
            var responseData = result.data
            res.json(responseData)
        } catch (e) {
            res.send(result.data)
        }
    }).catch(function (err) {
        console.error(err);
    });
});


app.post("/api/*", function (req, res, next) {

    const  headers= {  "Content-type": "Application/json", 
        "authorization": `SAML token= ${req.session.SAMLResponse.replace(/\r?\n|\r/g, '')}`}

    var url = 'http://localhost:9002' + req.originalUrl.replace("/api", "/v1")

    axios.post(url,req.body,  {headers}).then(function (result) {
        // result: {data: buffer, res: response object}
        try {
            var responseData =result.data
            res.json(responseData)
        } catch (e) {
            res.send(result.data)
        }
    }).catch(function (err) {
        console.error(err);
    });

});

app.put("/api/*", function (req, res, next) {

    const  headers= {  "Content-type": "Application/json", 
    "authorization": `SAML token= ${req.session.SAMLResponse.replace(/\r?\n|\r/g, '')}`}

    var url = 'http://localhost:9002' + req.originalUrl.replace("/api", "/v1")

    axios.put(url, req.body,  {headers}).then(function (result) {
        // result: {data: buffer, res: response object}
        try {
            var responseData = result.data
            res.json(responseData)
        } catch (e) {
            res.send(result.data)
        }
    }).catch(function (err) {
        console.error(err);
    });
});

app.delete("/api/*", function (req, res, next) {

  
    const  headers= {  "Content-type": "Application/json", 
    "authorization": `SAML token= ${req.session.SAMLResponse.replace(/\r?\n|\r/g, '')}`}

    var url = 'http://localhost:9002' + req.originalUrl.replace("/api", "/v1")


    axios.delete(url,  {headers}).then(function (result) {
        // result: {data: buffer, res: response object}
        res.status(204).send("OK")
    }).catch(function (err) {
        console.error(err);
    });
});

app.use(express.static(path.join(__dirname, '../frontend/dist/spa')));

https
    .createServer(
        {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.cert"),
        },
        app
    )
    .listen(3080, function () {
        console.log(
            "Example app listening on port 3080! Go to https://localhost:3080/"
        );
    });