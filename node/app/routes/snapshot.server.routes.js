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

var env = require('../env/' + process.env.NODE_ENV);
/**
 * Create the routes for handling snapshot
 * requests.
 * @param app
 */
module.exports = function (app) {
  var snapshot = require('../controllers/snapshot.server.controller.js');
  var schedule = require('../controllers/schedule.server.controller.js');
  app.route('/usnap/api/' + env.server.version + '/snapshot')
    .get(snapshot.listSnapshots)
    .delete(snapshot.deleteAllSnapshots);
  app.route('/usnap/api/' + env.server.version + '/snapshot/:snapId')
    .post(snapshot.changeSnapshotStatus)
    .delete(snapshot.deleteSnapshot);
  app.route('/usnap/api/' + env.server.version + '/snapshot/name/:snapName')
    .post(snapshot.changeSnapshotStatus)
    .delete(snapshot.deleteSnapshot);

  app.param('snapId', schedule.schedById);
  app.param('snapName', schedule.schedByName);
};