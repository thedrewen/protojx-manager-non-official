import { Canvas } from "canvas";
import * as dayjs from "dayjs";
import { Dayjs } from "dayjs";
import { writeFile } from "fs";

function createUptimeBar(uptimes: { up: boolean, date: Dayjs }[]) {
    const now = dayjs();
    const week = now.clone().subtract(1, 'week');

    const canvas = new Canvas(100, 2, "image");
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "#27FF00";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxTime = (now.unix() - week.unix());
    const ranges: { min: number, max: number }[] = [];

    let minTime: number | null = null;
    uptimes.map((element, index) => {
        const positionForMaxTime = (element.date.unix() - week.unix());
        const percent = Math.round((positionForMaxTime / maxTime) * 100);

        if (ranges.length == 0 && minTime == null) {
            if (element.up && minTime == null) {
                ranges.push({
                    min: 0,
                    max: percent
                });
            } else {
                minTime = percent;
            }
        } else {
            if (!element.up) {
                minTime = percent;
                
                if(minTime != null && index == uptimes.length - 1) {
                    ranges.push({
                        min: minTime,
                        max: 100
                    });
                } 
            } else {
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
    ranges.map((value) => {
        ctx.fillRect(value.min, 0, value.max - value.min, canvas.height);
    });

    writeFile('test.png', canvas.toBuffer('image/png'), (err) => {
        if (err) throw err;
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