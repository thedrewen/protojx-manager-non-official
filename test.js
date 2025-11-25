"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var canvas_1 = require("canvas");
var dayjs = require("dayjs");
var fs_1 = require("fs");
function createUptimeBar(uptimes) {
    var now = dayjs();
    var week = now.clone().subtract(1, 'week');
    var canvas = new canvas_1.Canvas(100, 2, "image");
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "#27FF00";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var maxTime = (now.unix() - week.unix());
    var ranges = [];
    var minTime = null;
    uptimes.map(function (element, index) {
        var positionForMaxTime = (element.date.unix() - week.unix());
        var percent = Math.round((positionForMaxTime / maxTime) * 100);
        if (ranges.length == 0 && minTime == null) {
            if (element.up && minTime == null) {
                ranges.push({
                    min: 0,
                    max: percent
                });
            }
            else {
                minTime = percent;
            }
        }
        else {
            if (!element.up) {
                minTime = percent;
                if (minTime != null && index == uptimes.length - 1) {
                    ranges.push({
                        min: minTime,
                        max: 100
                    });
                }
            }
            else {
                if (minTime) {
                    ranges.push({
                        min: minTime,
                        max: percent
                    });
                }
            }
        }
    });
    ctx.fillStyle = '#ff0000';
    ranges.map(function (value) {
        ctx.fillRect(value.min, 0, value.max - value.min, canvas.height);
    });
    (0, fs_1.writeFile)('test.png', canvas.toBuffer('image/png'), function (err) {
        if (err)
            throw err;
        console.log('Image saved!');
    });
}
createUptimeBar([
    {
        up: true,
        date: dayjs().subtract(6, 'day')
    },
    {
        up: false,
        date: dayjs().subtract(3, 'day')
    },
    {
        up: true,
        date: dayjs().subtract(1, 'day')
    },
    {
        up: false,
        date: dayjs().subtract(1, 'hour')
    }
]);
