/*
 * Copyright (C) 2020 by SenseTime Group Limited. All rights reserved.
 * Zhang Conghai <zhangconghai@senseauto.com>
 */

const WebSocket = require('ws')
const data = require('./data')
var fs=require('fs')

const SLICE=20;
const SPEED=3;

const args = require('minimist')(process.argv.slice(2))
console.log(args);
let filename=args['input']
let mode=args['mode']

if (!mode){
    mode='RANDOM';
}

console.log(filename, mode);

const wss = new WebSocket.Server({ port: 8082, path:'/websocket' })

var it = 0
var obj;

let slots={};
let startTime=Number.POSITIVE_INFINITY;
let endTime=Number.NEGATIVE_INFINITY;
let loaded=false;
let count=0;
//  { type: 'receive',
//    time: 1618472950.7014341,
//    opcode: 1,
//    data:
//     '{ "topic": "control_error", "type": "data", "value": {"value0":{"topic":"control_debug_info","type":"text","data":["NON_AUTO_STATE","[CL]cte: 0.000","[CL]v_err: 0.000","[CL]p_err: 0.000","[CL]vel_ff: 0.000","[CL]acc_ff: 0.000","[CL]acc cmd: 0.000","[CL]lat_acc: 0.000","[CL]lon_acc: 0.000","[CL]traj_size: 70"],"style":{"color":"#838371","top":"434.1177px","left":"1076.353px","fontSize":"14px"},"defaultEnable":true,"timestamp_nsec":0}}}' },



let json_input=fs.readFile(filename,'utf-8',function (err,data){
    if (err) console.log('err');
    obj=JSON.parse(data);
    // console.log('json parse done',obj,obj.log,obj.log.entries)
    obj.log.entries.map((e)=>{
        if (e._webSocketMessages){
            if (e.request.url=='ws://10.151.176.18:8082/websocket'){
                e._webSocketMessages.map((m)=>{
                    if (m.type!='receive') return;
                    let timeSlice=((m.time*1000/SLICE)|0)
                    if (timeSlice in slots){
                        slots[timeSlice]=slots[timeSlice].concat([m]);
                    }else{
                        slots[timeSlice]=[m];
                    }
                })
                // console.log(e._webSocketMessages);
            }
            console.log(Object.keys(slots))
            keys=Object.keys(slots);
            if (keys.length>1){
                keys.map((st)=>{
                    let cur=parseInt(st);
                    startTime=startTime>cur?cur:startTime;
                    endTime=endTime<cur?cur:endTime;
                })
                console.log(startTime,endTime);
                loaded=true;
                count=startTime;
            }
        }
    })
})




function intervalFunc() {
  //console.log('Cant stop me now!', wss.clients)
  if (wss.clients.size>0&&loaded) {
      if (count<endTime){
        count++;
      }else{
          if (true) {
              count=startTime;
          }else{
            process.exit(0)
          }

      }
      console.log(count);
      if (slots[count]){
        curMsgs=slots[count];
        console.log('hit');
          for (let it of wss.clients.values()){
              curMsgs.map((m)=>{
                  it.send(m.data);
              })
          }
      }
  }
}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message)
  })
})

setInterval(intervalFunc, SLICE/SPEED)
//process.exit(1)
