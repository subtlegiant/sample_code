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

var config = require('../config'),
    path = require('path'),
    mongoose = require('mongoose');

module.exports.loadModels = function () {
  config.files.server.models.forEach(function (modelPath) {
    require(path.resolve(modelPath));
  });
};

// Initialize Mongoose
module.exports.connect = function () {
  // connect the database
  mongoose.connect(config.db, function (err) {
    // Log Error
    if (err) {
      console.error('Could not connect to MongoDB!');
      console.log(err);
    }
  });
}