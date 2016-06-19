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
 * Initialize the Express app (our node framework).
 * http://expressjs.com/
 * Set up the baseUri route.
 * Looks for other routes in routes directory.
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    config = require('../config'),
    path = require('path');

module.exports.init = function () {
  var app = express();
  var router = express.Router();

  // configure app to use bodyParser()
  // this will let us get data from a POST
  app.use(bodyParser.urlencoded({ extended: true}));
  app.use(bodyParser.json());
  app.use('/usnap', router);

  this.initServerRoutes(app);

  router.use(function(req, res, next) {
    next();
  });

  router.get('/', function(req, res) {
    res.json({ message: 'hello world!'});
  });

  return app;
};

module.exports.initServerRoutes = function (app) {
  config.files.server.routes.forEach(function (routePath) {
    require(path.resolve(routePath))(app);
  });
};

