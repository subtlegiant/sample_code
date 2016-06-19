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

var env = require('../env/' + process.env.NODE_ENV),
    fs = require('fs');

exports.listSnapshots = function (req, res) {
  var fileList = fs.readdirSync(env.server.snap_dir);
  var resp = {};
  resp.snapshots = fileList;

  res.json(resp);
};

exports.deleteAllSnapshots = function (req, res) {
   //TODO Stop any snapshots that are in process
  var snap_dir = fs.readdirSync(env.server.snap_dir);
  for (var i in snap_dir) {
    fs.unlinkSync(env.server.snap_dir + snap_dir[i]);
  }

  res.status(204).send();
};

exports.changeSnapshotStatus = function (req, res) {
  var snapshot = req.model;
  var respStatus = 204;
  var update = {};

  switch (req.model.status) {
    case 'SCHEDULED':
      respStatus = 304;
      break;
    case 'RECORDING':
      //TODO stop recording
    case 'PLAYING':
      //TODO stop playback
      update.status = 'DONE';
      break;
    case 'DONE':
      //TODO start playback
      update.status = 'PLAYING';
      break;
  }

  if (respStatus == 204) {
    // update snapshot status in DB
    snapshot.update(update, function (err, doc) {
      if (err) {
        return res.status(400).send({message: err});
      }
      res.status(respStatus).send();
    });
  } else {
    res.status(respStatus).send();
  }
};

exports.deleteSnapshot = function (req, res) {
  var snapshot = req.model;

  if (req.model.status == 'DONE') {
    fs.unlinkSync(env.server.snap_dir + req.model.snap_name);
    res.status(204).send();
  } else {
    res.status(304).send();
  }
};

