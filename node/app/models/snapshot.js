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

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * This is the document model that is
 * stored in the Mongo DB which represents
 * a scheduled snapshot.
 *
 * status: 'scheduled',  'recording', or 'complete'
 * startTime: Time and date the snapshot is scheduled
 * duration: length of the scheduled snapshot
 * input: The LCR RF input
 * width: Frequency width of the snapshot
 * centerFreq: Center frequency
 */
var SnapshotSchema = new Schema({
  snap_name: { type: String, unique: true, dropDups: true, sparse: true },
  status: String,
  start_time: Date,
  duration: Number,
  rf_input_num: Number,
  input_width: Number,
  input_center_freq: Number
});

mongoose.model('Snapshot', SnapshotSchema);
