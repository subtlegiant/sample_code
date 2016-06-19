/*
 * Copyright (c) 2015 Engineering Design Team (EDT), Inc.
 * All rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * This file is subject to the terms and conditions of the EULA defined at
 * www.edt.com/terms-of-use
 *
 * Author: <Cameron Kidd>
 * Email: <cameron@edt.com>
 */
'use strict';
/**
 * Here we intialize all of the
 * configuration parameters, connect to the
 * database and open the listener port to
 * handle requests on the REST endpoint.
 */

// call the packages we need
var config = require('../config'), // our configuration parameters
    mongoose = require('./mongoose'), // library handles interaction with the Mongo DB
    express = require('./express'), // our local app
    fs = require('fs'),
    https = require('https'),
    pem = require('pem');

mongoose.loadModels();

module.exports.loadModels = function loadModels() {
  mongoose.loadModels();
};

module.exports.start = function start() {

  var app = express.init();

  mongoose.connect();


  https.createServer({
      key: fs.readFileSync('cert/usnap_pub_key.pem'),
      cert: fs.readFileSync('cert/cacert.pem')
    }, app).listen(config.port);

  //start the server
  //app.listen(config.port);
};




