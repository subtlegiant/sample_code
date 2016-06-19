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
 * The route to create config.
 * @param req - request object, holds all of the json data from the PUT
 * @param res - response object
 */
exports.createConfig = function (req, res) {
  var config = new Config(req.body);
  var resp = {};

  config.save(function (err) {
    buildConfigResponse(config, resp);

    if (err) {
      console.log(err);
      return res.status(400).send({message: err});
    }

    res.status(201).json(resp);
  });
};

exports.getAllConfigs = function (req, res) {
  Config.find({}, function(err, configs) {
    var resp = [];
    if (err) {
      return res.status(400).send({message: err});
    }

    configs.forEach(function (config) {
      var respConfig = {};
      buildConfigResponse(config, respConfig);
      resp.push(respConfig);
    });
    res.json(resp);
  });
};

/**
 * Get a sprecified config by name or id
 * @param req
 * @param res
 */
exports.getConfig = function (req, res) {
  var resp = {};
  buildConfigResponse(req.model, resp);
  res.json(resp);
};

/**
 * Delete a scheduled config from the database.
 * @param req - request object, has already gone through middleware
 *              which finds the requested snapshot in the database
 *              by id, or unique name. req == that snapshot.
 * @param res = response object
 */
exports.deleteConfig = function (req, res) {
  var config = req.model;
  var resp = {};
  config.remove(function (err) {
    if (err) {
      return res.status(400).send({message: err});
    }

    buildConfigResponse(config, resp);
    res.json(resp);
  });
};

/**
 * Clear the config collection.
 * @param req - request object, should be empty
 * @param res - response object
 */
exports.deleteAllConfigs = function (req, res) {
  Config.find({}, function(err, configs) {
    configs.forEach(function(config) {
      config.remove(function () {});
    });

    res.status(204).send();
  });
};

exports.updateConfig = function (req, res) {
  var config = req.model;
  config.update(req.body, function (err, doc) {
    if (err) {
      return res.status(400).send({message: err});
    }
    res.status(200).send();
  });
};

/**
 * Checks that an id is either a valid id or
 * a name of a config that exists in the
 * database.  Returns error if any of these cases
 * fail.
 * @param req
 * @param res
 * @param next
 * @param id
 */
exports.configById = function (req, res, next, id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    /**
     * Find a config in the database by id.
     */
    Config.findById(id).exec(function (err, config) {
      if (err) {
        return res.status(400).send({message: err});
      } else if (!config) {
        return res.status(404).send({message: err});
      }
      req.model = config;
      next();
    });
  }
};

exports.configByName = function (req, res, next, name) {
  Config.findOne({'config_name': name}, function (err, doc) {
    if (err) {
      return res.status(400).send({message: err});
    } else if (!doc) {
      return res.status(404).send({message: err});
    }
    req.model = doc;
    next();
  });
};

var buildConfigResponse = function (config, resp) {
  resp.id = config._id;
  resp.rf_input_num = config.rf_input_num;
  resp.input_width = config.input_width;
  resp.input_center_freq = config.input_center_freq;
  resp.config_name = config.config_name;
};
