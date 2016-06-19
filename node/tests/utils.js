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
 * Test utility methods.
 */

var config = require('../app/config');
var mongoose = require('mongoose');
var fs = require('fs');
var env = require('../app/env/' + process.env.NODE_ENV);

/*
 * Before each test clear the test database,
 * and open a connection.
 */
beforeEach(function(done) {
  function clearDb() {
    for (var i in mongoose.connection.collections) {
      mongoose.connection.collections[i].remove(function() {});
    }

    var snap_dir = fs.readdirSync(env.server.snap_dir);
    for (var i in snap_dir) {
      fs.unlinkSync(env.server.snap_dir + snap_dir[i]);
    }
    return done();
  }

  if (mongoose.connection.readyState == 0) {
    mongoose.connect(config.db, function (err) {
      if (err) {
        throw err;
      }
      return clearDb();
    });
  } else {
    return clearDb()
  }
});

/**
 * After every test close the database.
 */
afterEach(function (done) {
  mongoose.disconnect();
  return done();
});