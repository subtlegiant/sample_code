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

var mongoose = require('mongoose'),
    Snapshot = mongoose.model('Snapshot'),
    Config = mongoose.model('Config');


/*
 * The route to schedule a snapshot.
 * @param req - request object, holds all of the json data from the PUT
 * @param res - response object
 */
exports.scheduleSnapshot = function (req, res) {
  var snapshot = new Snapshot();
  var resp = {};

  /* This is strictly for testing.
   * An application in production
   * should never pass in the status.
   */
  if (process.env.NODE_ENV == 'development') {
    if (req.body.status) {
      snapshot.status = req.body.status;
    } else {
      snapshot.status = 'SCHEDULED'
    }
  } else {
    snapshot.status = 'SCHEDULED';
  }

  snapshot.snap_name = req.body.snap_name;
  snapshot.duration = req.body.duration;
  snapshot.rf_input_num = req.body.rf_input_num;
  snapshot.input_center_freq = req.body.input_center_freq;
  snapshot.input_width = req.body.input_width;

  snapshot.save(function (err) {
    buildScheduleResponse(snapshot, resp);

    if (err) {
      console.log(err);
      return res.status(400).send({message: err});
    }

    res.status(201).json(resp);
  });
};

exports.getAllSchedules = function (req, res) {
  Snapshot.find({}, function(err, snapshots) {
    var resp = [];
    if (err) {
      return res.status(400).send({message: err});
    }

    snapshots.forEach(function (snapshot) {
      var respSnap = {};
      buildScheduleResponse(snapshot, respSnap);
      resp.push(respSnap);
    });
    res.json(resp);
  });
};

/**
 * Get a sprecified snapshot by name or id
 * @param req
 * @param res
 */
exports.getSchedule = function (req, res) {
  var resp = {};
  buildScheduleResponse(req.model, resp);
  res.json(resp);
};

exports.deleteAllSchedules = function (req, res) {
  Snapshot.find({}, function(err, snapshots) {
    snapshots.forEach(function(snapshot) {
      snapshot.remove(function () {});
    });

    res.status(204).send();
  });
};

/**
 * Delete a scheduled snapshot from the database.
 * @param req - request object, has already gone through middleware
 *              which finds the requested snapshot in the database
 *              by id, or unique name. req == that snapshot.
 * @param res = response object
 */
exports.deleteSchedule = function (req, res) {
  var snapshot = req.model;
  var resp = {};
  snapshot.remove(function (err) {
    if (err) {
      return res.status(400).send({message: err});
    }

    buildScheduleResponse(snapshot, resp);
    res.json(resp);
  });
};

exports.updateSchedule = function (req, res) {
  var snapshot = req.model;
  snapshot.update(req.body, function (err, snap) {
    if (err) {
      return res.status(400).send({message: err});
    }
    res.status(204).send();
  });
};

/**
 * Scheduler middleware
 */

/*
 * If the request includes a config name, it will
 * try to find that config in the database and
 * use its values, otherwise it will create an entry
 * in the database.
 */
exports.getConfig = function (req, res, next) {

  if (req.body.config_name) {
    Config.findOne({'config_name': req.body.config_name}, function(err, config) {
      // No config was found, Create one.
      if (!config) {
        config = new Config();
        config.config_name = req.body.config_name;
        config.rf_input_num = req.body.rf_input_num;
        config.input_center_freq = req.body.input_center_freq;
        config.input_width = req.body.input_width;

        config.save(function (err) {
          if (err) {
            return res.status(400).send({message: err});
          }
        });
      } else {
        req.body.rf_input_num = config.rf_input_num;
        req.body.input_width = config.input_width;
        req.body.input_center_freq = config.input_center_freq;
      }
      next();
    });
  } else {
    next();
  }
};

/**
 * Checks that an id is either a valid id or
 * a name of a snapshot that exists in the
 * database.  Returns error if any of these cases
 * fail.
 * @param req
 * @param res
 * @param next
 * @param id
 */
exports.schedById = function (req, res, next, id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    /**
     * Find a snapshot in the database by id.
     */
    Snapshot.findById(id).exec(function (err, snapshot) {
      if (err) {
        return res.status(400).send({message: err});
      } else if (!snapshot) {
        return res.status(404).send({message: err});
      }
      req.model = snapshot;
      next();
    });
  }
};

exports.schedByName = function (req, res, next, name) {
  Snapshot.findOne({'snap_name': name}, function (err, snapshot) {
    if (err) {
      return res.status(400).send({message: err});
    } else if (!snapshot) {
      return res.status(404).send({message: err});
    }
    req.model = snapshot;
    next();
  });
};

var buildScheduleResponse = function (snapshot, resp) {
  resp.start_time = snapshot.start_time;
  resp.duration = snapshot.duration;
  resp.id = snapshot._id;
  resp.rf_input_num = snapshot.rf_input_num;
  resp.input_width = snapshot.input_width;
  resp.input_center_freq = snapshot.input_center_freq;
  resp.status = snapshot.status;
  resp.snap_name = snapshot.snap_name;
};
