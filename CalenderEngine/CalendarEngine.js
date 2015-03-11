var Acts = [],
month = 0,
week = 100,
day = 200,
maxZoom = 300,
viewTime = 0,
selectedTime = new Date(),
selectedDate = 0,
canvas,
canvasWidth,
canvasHeight,
firstLine,
last,
selectedWeekday,
weeksInSelectedMonth,
daysInSelectedMonth,
monthMinuteOffset,
weekMinuteOffset,
dayMinuteOffset,
topMinuteOffset = 0,
weekDays = [],
monthNames = [],
startDayOfWeek,
clickAreas = [],
addClickAreas = true,
offsetMilisecs = new Date(2000, 0, 1).getTime(),
isZooming = false,
isAnimating = false,
minInc = 0,
dayNumColor = "rgb(0,0,0)",
bgGrad = new Image(),// 'rgba(100,100,100, 0.5)',
defGrad = new Image(), //'rgb(100,100,100)',
topOfst = 35,
tBrOfst = 60.5;

weekDays[0] = 'Monday';
weekDays[1] = 'Tuesday';
weekDays[2] = 'Wednesday';
weekDays[3] = 'Thursday';
weekDays[4] = 'Friday';
weekDays[5] = 'Saturday';
weekDays[6] = 'Sunday';

monthNames[0] = "January";
monthNames[1] = "February";
monthNames[2] = "March";
monthNames[3] = "April";
monthNames[4] = "May";
monthNames[5] = "June";
monthNames[6] = "July";
monthNames[7] = "August";
monthNames[8] = "September";
monthNames[9] = "October";
monthNames[10] = "November";
monthNames[11] = "December";


/**
* @constructor
*/
function Act(start, end, actid) {// minuter från 2000-01-01 00:00, är det tidigare så är det negativt
    this.start = start;
    this.end = end;
    this.startLoc = null;
    this.endLoc = null;
    this.startId = null;
    this.endId = null;
    this.actid = actid;
    this.top = 0;
    this.conflicted = false;
    this.conflictID = null;
    this.selected = false;
    this.notes = null;
    this.schid = 0;
    this.style = 0;
    this.code = 0;
    this.toolTip = "";
    this.leftInfo = "";
    this.rightInfo = "";
    //this.addHoc = false;
    this.blocktype = 0;
    this.isLocked = false;
    this.hasOnward = false;
    this.onwardAnimation = 0;
    this.onwardId = 0;
    this.additional = [];
    this.contType = 0;
}

/**
* @constructor
*/
function ClickArea(x, y, width, height) {
    if (width <= 0) {
        width = (-width);
        x = x - width;
        if (width <= 1) {
            width = 2;
        }
    }
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.Click = function () { };
    this.arguments = [];
    this.selectable = false;
    this.id = null;
    this.Hover = null;
    this.InsideChecker = IsInsideSquare;
    this.visibit = 0;
}
bgGradLoaded =false, defGradLoaded = false;
function InitiateCalendar() {
    var context = canvas.getContext('2d');

    UpdateCanvasHeights();

    firstLine = canvasWidth / 15,    

    context.fillStyle = "rgb(220,220,220)";
    context.fillRect(0, topOfst, canvasWidth, 25.5);
    context.fillStyle = "rgb(250,250,250)";
    context.fillRect(0, tBrOfst, firstLine, canvasHeight - tBrOfst);
    
    var bgrad = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    bgrad.addColorStop(0, 'rgba(100,100,100, 0.5)');
    bgrad.addColorStop(1, 'rgba(150,150,150, 0.5)');
    context.fillStyle = bgrad;
    context.fillRect(firstLine, tBrOfst, canvasWidth - firstLine, canvasHeight - tBrOfst);

    bgGrad = new Image();
    bgGrad.onload = function () {
        bgGradLoaded = true;
        if (defGradLoaded) {
            DrawCalendar();
        }
    };
    bgGrad.src = canvas.toDataURL();

    var dgrad = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    dgrad.addColorStop(0, 'rgb(100,100,100)');
    dgrad.addColorStop(1, 'rgb(150,150,150)');
    context.fillStyle = dgrad;
    context.fillRect(firstLine, tBrOfst, canvasWidth - firstLine, canvasHeight - tBrOfst);

    defGrad = new Image();
    defGrad.onload = function () {
        defGradLoaded = true;
        if (bgGradLoaded) {
            DrawCalendar();
        }
    };
    defGrad.src = canvas.toDataURL();    

    window.requestAnimFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */callback, /* DOMElement */element) {
            window.setTimeout(callback, 15);
        };

    window.cancelRequestAnimFrame = window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        clearTimeout;
}

function UpdateCanvasHeights() {
    canvasHeight = canvas.offsetHeight;
    canvasWidth = canvas.offsetWidth;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
}

function DrawCalendar() {
    var context = canvas.getContext('2d');

    var dayWidth,
    hlfcan = canvasWidth / 2,
    currIndx = 0,
    noBlur = (!isZooming && !isAnimating);
    
    clickAreas = [];

    if (noBlur) {        
        context.fillStyle = "rgb(248, 182, 23)";
        context.fillRect(0, 0, canvasWidth, topOfst);        

        context.fillStyle = "rgb(0,0,0)";
        context.font = 'bold 16px arial';
        context.textBaseline = 'top';
        
        var txt = selectedTime.getDate() + " " + monthNames[selectedTime.getMonth()] + " " + selectedTime.getFullYear();

        context.fillText(txt, hlfcan - topOfst, 5);

        context.drawImage(defGrad, 0, 0);
    } else {
        context.drawImage(bgGrad, 0, 0);
    }

    context.strokeStyle = 'rgb(160,160,160)';

    if (viewTime < week) {
        if (viewTime <= month) { viewTime = month; }

        var nSelheig = 1 - ((viewTime - month) / 100);

        hlfDayWid = canvasWidth / 7.5;

        roundWid = Math.floor(hlfDayWid);

        context.lineWidth = 1;

        context.beginPath();

        context.font = 'bold 12px arial';
        context.textBaseline = 'top';

        var drawnLines = [],
        maxWid = Math.floor(hlfDayWid / 7) - 12;

        var total = canvasWidth;
        for (var i = 7; i >= 0; i--) {
            var px = GetSpotOnPixel(total);

            if (i < 7) {
                drawnLines[i] = px;
                txt = weekDays[i];
                if (maxWid <= 0)
                    txt = txt.slice(0, 3);

                context.fillStyle = "rgb(0,0,0)";
                context.fillText(txt, GetRounded(total + 10), topOfst + 5); //, maxWid)
                if (i % 2) {
                    if (noBlur) {
                        context.fillStyle = "rgba(255,255,255,0.1)";
                    } else { context.fillStyle = "rgba(255,255,255,0.05)"; }
                    context.fillRect(px, topOfst, hlfDayWid, canvasHeight - topOfst);
                }
            } else {
                context.moveTo(px, topOfst);
                context.lineTo(px, canvasHeight);
            }

            total -= hlfDayWid;
        }
        var inc = ((canvasHeight - 60) / weeksInSelectedMonth),
        totDays = 0,
        defInc = inc * nSelheig,
        nxInc = defInc,
        currTime = monthMinuteOffset,
        nextTime = currTime + 1440,
        toDraw=null;
        total = 60;
        context.font = '12px arial';
        context.save();

        minInc = nxInc / 1440;

        while (true) {
            if (currIndx < Acts.length && Acts[currIndx].end < currTime) {
                currIndx++;
                continue;
            }
            break;
        }
        for (var i = weeksInSelectedMonth; i >= 0; i--) {
            var px = GetSpotOnPixel(total);
            context.moveTo(0, px);
            context.lineTo(canvasWidth, px);
            if ((totDays == 0 && 8 - selectedDate > startDayOfWeek) || (totDays > 0 && totDays < selectedDate && (totDays + 7) >= selectedDate)) {
                nxInc = (canvasHeight - 60) - defInc * (weeksInSelectedMonth - 1);
            } else { nxInc = defInc; }
            minInc = nxInc / 1440;            
            for (j = 0, jj = drawnLines.length; j < jj; j++) {
                if ((totDays == 0 && j != startDayOfWeek) || totDays >= daysInSelectedMonth) { continue; }
                totDays++;
                
                var dayIsSelected = (totDays == selectedDate);

                currIndx = DrawActsInsidePeriod(context, currIndx, currTime, nextTime, drawnLines[j], total, hlfDayWid, minInc);


                if (dayIsSelected) {
                    if (noBlur) {
                        context.fillStyle = "rgba(255,255,100,0.2)";
                    } else { context.fillStyle = "rgba(255,255,100,0.125)"; }
                    context.fillRect(drawnLines[j], px, hlfDayWid, nxInc);
                }

                if (noBlur) {
                    var ca = new ClickArea(drawnLines[j], px, hlfDayWid, nxInc);
                    ca.arguments = [totDays];
                    if (typeof (dayClick) != 'undefined') {
                        ca.Click = dayClick;
                    }
                    clickAreas.push(ca);
                }

                currTime = nextTime;
                nextTime += 1440;

                context.fillStyle = dayNumColor;
                if (dayIsSelected) {
                    context.font = "italic bold 16px arial";
                    restore = true;
                }
                context.fillText(totDays, drawnLines[j], px);
                if (dayIsSelected) { context.restore(); }  
            }
            total += nxInc;
        }

    } else if (week <= viewTime && viewTime < day) {

        var nSelwid = 1 - ((viewTime - week) / 100);
        var opc = 0.1 * nSelwid;
        if (isZooming || isAnimating) { opc = opc / 2; }

        hlfDayWid = canvasWidth / 7.5;

        context.lineWidth = 1;

        context.beginPath();

        context.font = 'bold 12px arial';
        context.textBaseline = 'top';

        var drawnLines = [],
        maxWid = Math.floor(hlfDayWid / 7) - 12,
        currTime = weekMinuteOffset,
        nextTime = currTime + 1440,
        nInc = hlfDayWid,
        total = firstLine,
        totDays = selectedDate - selectedWeekday + 1;

        minInc = (canvasHeight - 60) / 1440;

        while (true) {
            if (currIndx < Acts.length && Acts[currIndx].end < currTime) {
                currIndx++;
                continue;
            }
            break;
        }
        for (var i = 0, ii= 7; i <ii; i++) {
            var px = GetSpotOnPixel(total);
//            context.moveTo(px, topOfst);
//            context.lineTo(px, canvasHeight);

            var dayIsSelected = (totDays == selectedDate);            

            if (dayIsSelected) {
                nInc = canvasWidth - firstLine - ((hlfDayWid * nSelwid) * 6);                
            } else { nInc = hlfDayWid * nSelwid; }


            if (i < 7) {
                drawnLines[i] = px;

                txt = weekDays[i];
                if (nInc > 33) {
                    context.fillStyle = "rgb(0,0,0)";
                    if (nInc <= 55)
                        txt = txt.slice(0, 3);
                    context.font = "bold 12px arial";
                    context.fillText(txt, GetRounded(total + 10), topOfst + 5); //, maxWid)
                }

                if (i % 2) {
                    context.fillStyle = "rgba(255,255,255," + opc + ")";
                    context.fillRect(total, topOfst, nInc, canvasHeight - topOfst);
                }                
            }


            currIndx = DrawActsInsidePeriod(context, currIndx, currTime, nextTime, total, 60, nInc, minInc);


            if (dayIsSelected) {
                context.fillStyle = "rgba(255,255,100," + (opc * 2) + ")";
                context.fillRect(px, 60, nInc, canvasHeight - 60);
            }

            if (noBlur) {
                var ca = new ClickArea(px, 60, nInc, canvasHeight - 60);
                ca.arguments = [totDays];
                if (typeof (dayClick) != 'undefined') {
                    ca.Click = dayClick;
                }
                clickAreas.push(ca);
            }
            
            if (i < 7) {                
                context.fillStyle = dayNumColor;
                if (totDays > 0) {
                    if (totDays > daysInSelectedMonth) { totDays = 1; }
                    if (totDays == selectedDate) {
                        context.font = "italic bold 16px arial";                      
                    } else { context.font = "12px arial"; }

                    if (nInc > 5) {
                        context.fillText(totDays, total, 60);
                    }
                }
            }
            
            currTime = nextTime;
            nextTime += 1440;

            totDays++;
            total += nInc;
        }
        context.moveTo(0, 60.5);
        context.lineTo(canvasWidth, 60.5);
        
        context.stroke();
        context.beginPath();

        var ms = 0,
            tmPx = 60,
            hInc = 120 * minInc,
            ln = firstLine - 20;
        context.font = "10px arial";
        opac = 1;
        if (nSelwid > 0.1) { opac = 1 - nSelwid + 0.1; }
        context.fillStyle = "rgba(0,0,0," + opac + ")";
        context.strokeStyle = "rgba(75,75,75," + opac + ")";
        while (ms <= 22) {
            var pxs = GetSpotOnPixel(tmPx);
            context.moveTo(ln, pxs);
            context.lineTo(canvasWidth, pxs);
            context.fillText(ms, ln, pxs);
            tmPx += hInc;
            ms+=2;
        }

    } else {
        var nSelheig = 1 + ((viewTime - day) / 100),
        frst = GetSpotOnPixel(firstLine);

        minInc = ((canvasHeight * nSelheig) - 60) / 1440;
        var hs = (canvasHeight - 60) / minInc;
        currTime = dayMinuteOffset + topMinuteOffset,
        nextTime = currTime + hs,
        nInc = canvasWidth - firstLine;

        context.beginPath();

        //context.moveTo(frst, topOfst);
        //context.lineTo(frst, canvasHeight);
        context.moveTo(0, 60.5);
        context.lineTo(canvasWidth, 60.5);

        while (true) {
            if (currIndx < Acts.length && Acts[currIndx].end < currTime) {
                currIndx++;
                continue;
            }
            break;
        }

        currIndx = DrawActsInsidePeriod(context, currIndx, currTime, nextTime, frst, 60, nInc, minInc);

        context.stroke();
        context.beginPath();

        var ms = Math.ceil(topMinuteOffset / 120),
        tmPx = 60 + (((ms * 120) - topMinuteOffset) * minInc),
        hInc = 120 * minInc,
        ln = frst - 20;
        ms -= 1;
        context.font = "10px arial";
        context.fillStyle = "rgb(0,0,0)";
        context.strokeStyle = "rgb(75,75,75)";
        while (ms < 24) {
            if (tmPx > canvasHeight) { break; }
            var pxs = GetSpotOnPixel(tmPx);
            context.moveTo(ln, pxs);
            context.lineTo(canvasWidth, pxs);
            ms++;
            tmPx += hInc;
            context.fillText((ms * 2), ln, pxs);
        }

        if (noBlur) {
            var ca = new ClickArea(total, 60, nInc, canvasHeight - 60);
            ca.arguments = [totDays];
            if (typeof (dayClick) != 'undefined') {
                ca.Click = dayClick;
            }
            clickAreas.push(ca);
        }

        context.fillStyle = "rgb(0,0,0)";
        context.font = "bold 12px arial";
        context.fillText(weekDays[selectedWeekday - 1], firstLine + 10, topOfst + 5);

        context.fillStyle = dayNumColor;
        context.font = "italic bold 16px arial";
        context.fillText(selectedDate, firstLine, 60);
           
    }
    context.stroke();

}


function DrawActsInsidePeriod(context, currIndx, currTime, nextTime, left, ceil, wid, minInc) {
    var endloc = "", fills, opc = ",0.8)", cnt = GetRounded(left + (wid / 2));
    if (isZooming || isAnimating) { opc = ",0.65)"; }
    while (currIndx < Acts.length && Acts[currIndx].end >= currTime && Acts[currIndx].start <= nextTime) {
        var start = ((Acts[currIndx].start > currTime) ? (Acts[currIndx].start - currTime) : 0),
                        top = GetSpotOnPixel(ceil + (start * minInc)),
                        end = ((Acts[currIndx].end < nextTime) ? (Acts[currIndx].end - currTime) : 1440),
                        height = GetRounded(minInc * (end - start));
        if (typeof (Acts[currIndx].style) != 'undefined' && Acts[currIndx].style != "1") {
            fills = "rgba(" + Acts[currIndx].style;
        } else { fills = "rgba(175,175,175"; }

        context.fillStyle = fills + opc;


        if (wid > 10) {
            var lft = left + 5, wd = wid - 10;
            context.fillRect(lft, top, wd, height);

            if (!isZooming && !isAnimating) {
                var ca = new ClickArea(lft, top, wd, height);
                if (typeof (Acts[currIndx].actid) != 'undefined') {
                    ca.arguments = [Acts[currIndx].actid];
                    if (typeof (actClick) != 'undefined') {
                        ca.Click = actClick;
                    }
                    clickAreas.push(ca);
                }

                context.font = "10px Verdana";

                if (Acts[currIndx].code && height > 17) {
                    var upper = top;
                    if (top - ceil < 3) {
                        upper = ceil;
                    }
                    upper += 5;

                    var hlfWid = GetRounded(context.measureText(Acts[currIndx].code).width / 2);

                    context.fillStyle = "rgb(255,255,255)";
                    context.fillText(Acts[currIndx].code, cnt - hlfWid, upper);
                }

                context.font = "12px arial";

                if (Acts[currIndx].endLoc) {
                    endloc = Acts[currIndx].endLoc;
                }
            }
        }
        if (end == 1440) { break; }

        currIndx++;
    }

    if (!isZooming && !isAnimating && endloc != "") {
        context.font = "bold 12px arial";

        var btm = ceil + (minInc * 1440);

        if (btm > canvasHeight)
            btm = canvasHeight;

        context.fillStyle = "rgb(225,225,0)";

        context.fillText(endloc, cnt - 12, GetRounded(btm - 16));

        context.font = "12px arial";
    }

    return currIndx;
}


var IsInsideSquare = function (canvas, newX, newY) {
    var tmpX = newX - canvas.offsetLeft;
    var tmpY = newY - canvas.offsetTop;
    if (tmpY >= this.y && tmpY <= (this.y + this.height)) {
        if (tmpX > this.x && tmpX < (this.x + this.width)) {
            return true;
        }
    }
    return false;
}


function GetActivityInside(newX, newY) {
    var inside = undefined;

    for (var c = 0, ca = clickAreas.length; c < ca; c++) {
        if (clickAreas[c].InsideChecker(canvas, newX, newY)) {
            if (clickAreas[c].visibit == 0 || (clickAreas[c].visibit >= 1 && actOpac >= 0.5) || (clickAreas[c].visibit <= -1 && actOpac < 0.5)) {
                inside = clickAreas[c];
                break;
            }
        }
    }

    return inside;
}

function GetActivitysInside(newX, newY) {
    var inside = [];

    for (var c = 0, ca = clickAreas.length; c < ca; c++) {
        if (clickAreas[c].InsideChecker(canvas, newX, newY)) {
            if (clickAreas[c].visibit == 0 || (clickAreas[c].visibit >= 1 && actOpac >= 0.5) || (clickAreas[c].visibit <= -1 && actOpac < 0.5)) {
                inside.push(clickAreas[c]);
            }
        }
    }

    return inside;
}


function GetRounded(a) { return ~ ~(0.5 + a) };

function GetSpotOnPixel(a) { return (a | 0) + 0.5 };

function GetRelativeYPix(mins, rowHeight) {
    return mins * rowHeight / 1440;
}

function SortActs() {
    Acts.sort(function (a, b) {
        return a.start - b.start;
    });
}

function CreateVerticleGrad(context, y1, y2) {
    var  grad = context.createLinearGradient(0, y1, 0, y2);
    grad.addColorStop(0, "rgba(255,255, 255, 0.25)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.25)");
    return grad;
}