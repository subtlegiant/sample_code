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

process.env.NODE_ENV = 'development';
var utils = require('./utils');
var config = require('../app/config');
var baseUri = 'https://localhost:' + config.port + '/usnap';
var expect = require('chai').expect;  // chai is a javascript assertion library.
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var mongoose = require('mongoose');
var snapshotModel = require('../app/models/snapshot');
var configModel = require('../app/models/config');
var Snapshot = mongoose.model('Snapshot');
var Config = mongoose.model('Config');
var fs = require('fs');
var cert = fs.readFileSync('cert/cacert.pem');
var request = require('superagent');
var env = require('../app/env/' + process.env.NODE_ENV);
chai.use(chaiHttp);

describe('Test list snapshots', function (done) {
  it('Creates two files in the snapshots directory, GETs list of snapshots in dir', function (done) {
    fs.writeFileSync(env.server.snap_dir + 'testSnap', 'test snap');
    fs.writeFileSync(env.server.snap_dir + 'testSnap1', 'test snap1');
    request
      .get('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot')
      .ca(cert)
      .end(function (error, response) {
        response.should.have.status(200);
        expect(response.body.snapshots[0]).to.equal('testSnap');
        expect(response.body.snapshots[1]).to.equal('testSnap1');
        done();
      });
  });
});

describe('Test delete snapshot route', function (done) {
  it('Creates two snapshot files, Send a DELETE, verfies snapshots directory is empty', function (done) {
    fs.writeFileSync(env.server.snap_dir + 'testSnap', 'test snap');
    fs.writeFileSync(env.server.snap_dir + 'testSnap1', 'test snap1');
    request
      .delete('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot')
      .ca(cert)
      .end(function (err, response) {
        response.should.have.status(204);
        var snapshots = fs.readdirSync(env.server.snap_dir);
        expect(snapshots.length).to.equal(0);
        done();
      });
  });
});

describe('Test changing snapshot state', function (done) {
  it('Schedule a snapshot in RECORDING state, stop recording by id, GET status should be DONE', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'RECORDING'
      })
      .end(function(err, response) {
        var id = response.body.id;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('RECORDING');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/' + id)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + id )
              .ca(cert)
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.status).to.equal('DONE');
                done();
              });
          });
      });
  });
});

describe('Test changing snapshot state', function (done) {
  it('Schedule a snapshot in PLAYING state, stop playing by id, GET status should be DONE', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'PLAYING'
      })
      .end(function(err, response) {
        var id = response.body.id;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('PLAYING');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/' + id)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + id )
              .ca(cert)
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.status).to.equal('DONE');
                done();
              });
          });
      });
  });
});

describe('Test changing snapshot state', function (done) {
  it('Schedule a snapshot in DONE state, start playback by id, GET status should be PLAYING', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'DONE'
      })
      .end(function(err, response) {
        var id = response.body.id;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('DONE');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/' + id)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/' + id )
              .ca(cert)
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.status).to.equal('PLAYING');
                done();
              });
          });
      });
  });
});

describe('Test changing snapshot state', function (done) {
  it('Schedule a snapshot in SCHEDULED state, hit the endpoint, status should return error', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10
      })
      .end(function(err, response) {
        var id = response.body.id;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('SCHEDULED');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/' + id)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(304);
            done();
          });
      });
  });
});

describe('Test changing snapshot status', function (done) {
  it('Schedules a snapshot with status RECORDING, POST to the endpoint by name, GET should have status of DONE', function(done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'RECORDING'
      })
      .end(function(err, response) {
        response.should.have. status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('RECORDING');
        var name = response.body.snap_name;
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/name/' + name)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/' + name)
              .ca(cert)
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.status).to.equal('DONE');
                done();
              });
          });
      })
  });
});

describe('Test changing snapshot status', function (done) {
  it('Schedule a snapshot in PLAYING state, POST to endpoint by name, GET status should be DONE', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'PLAYING'
      })
      .end(function(err, response) {
        var name = response.body.snap_name;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('PLAYING');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/name/' + name)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/' + name)
              .ca(cert)
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.status).to.equal('DONE');
                done();
              });
          });
      });
  });
});

describe('Test changing snapshot status', function (done) {
  it('Schedule a snapshot in DONE state, POST to endpoint by name, GET status should be PLAYING', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'DONE'
      })
      .end(function(err, response) {
        var name = response.body.snap_name;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('DONE');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/name/' + name)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            request
              .get('https://localhost:3000/usnap/api/' + env.server.version + '/schedule/name/' + name)
              .ca(cert)
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                expect(response.body.status).to.equal('PLAYING');
                done();
              });
          });
      });
  });
});

describe('Test changing snapshot status', function (done) {
  it('Schedule a snapshot in SCHEDULED state, POST to the endpoint by name, status should return error', function (done) {
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10
      })
      .end(function(err, response) {
        var name = response.body.snap_name;
        response.should.have.status(201);
        response.should.be.json;
        expect(response.body.status).to.equal('SCHEDULED');
        request
          .post('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/name/' + name)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(304);
            done();
          });
      });
  });
});

describe('Test deleting a snapshot by id', function (done) {
  it('Create a snapshot, schedule a snapshot in DONE status, DELETE snapshot', function (done) {
    fs.writeFileSync(env.server.snap_dir + 'testSnap', 'test snap');
    var date = Date.now();
    request
      .put('https://localhost:3000/usnap/api/' + env.server.version + '/schedule')
      .ca(cert)
      .send({
        'snap_name': 'testSnap',
        'duration': 2,
        'start_time': date,
        'rf_input_num': 0,
        'input_center_freq': 155520000,
        'input_width': 10,
        'status': 'DONE'
      })
      .end(function(err, response) {
        var id = response.body.id;
        response.should.have.status(201);
        response.should.be.json;
        request
          .delete('https://localhost:3000/usnap/api/' + env.server.version + '/snapshot/' + id)
          .ca(cert)
          .end(function (err, response) {
            response.should.have.status(204);
            var fileList = fs.readdirSync(env.server.snap_dir);
            expect(fileList.length).to.equal(0);
            done();
          });
      });
  });
});