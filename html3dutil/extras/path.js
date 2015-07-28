/*
Written by Peter O. in 2015.

Any copyright is dedicated to the Public Domain.
http://creativecommons.org/publicdomain/zero/1.0/
If you like this, you should donate to Peter O.
at: http://upokecenter.dreamhosters.com/articles/donate-now-2/
*/
/* global GLMath, define, exports */

(function (g,f) {
 "use strict";
if (typeof define==="function" && define.amd) {
  define([ "exports" ], f);
 } else if (typeof exports==="object") {
  f(exports);
 } else {
  f(g);
 }
}(this, function (exports) {
 "use strict";
if (exports.GraphicsPath) { return; }
/**
* Represents a two-dimensional path.
* <p>This class is considered a supplementary class to the
* Public Domain HTML 3D Library and is not considered part of that
* library. <p>
* To use this class, you must include the script "extras/path.js"; the
 * class is not included in the "glutil_min.js" file which makes up
 * the HTML 3D Library.  Example:<pre>
 * &lt;script type="text/javascript" src="extras/path.js">&lt;/script></pre>
* @class
*/
function GraphicsPath(){
 "use strict";
this.segments=[];
 this.incomplete=false;
 this.startPos=[0,0];
 this.endPos=[0,0];
}
/** @private */
var Triangulate={};
GraphicsPath.CLOSE=0;
GraphicsPath.LINE=1;
GraphicsPath.QUAD=2;
GraphicsPath.CUBIC=3;
GraphicsPath.ARC=4;
/**
* Returns whether the curve path is incomplete
* because of an error in parsing the curve string.
* This flag will be reset if a moveTo command,
* closePath command, or another path segment
* is added to the path.
* @return {boolean} Return value.*/
GraphicsPath.prototype.isIncomplete=function(){
 "use strict";
return this.incomplete;
};
GraphicsPath._startPoint=function(a){
 "use strict";
if(a[0]===GraphicsPath.CLOSE){
  return [0,0];
 } else {
  return [a[1],a[2]];
 }
};
GraphicsPath._endPoint=function(a){
 "use strict";
if(a[0]===GraphicsPath.CLOSE){
  return [0,0];
 } else if(a[0]===GraphicsPath.ARC){
  return [a[8],a[9]];
 } else {
  return [a[a.length-2],a[a.length-1]];
 }
};
GraphicsPath._point=function(seg,t){
 "use strict";
 var a,b,x,y;
if(seg[0]===GraphicsPath.CLOSE){
  return [0,0];
 } else if(seg[0]===GraphicsPath.LINE){
  return [
   seg[1]+(seg[3]-seg[1])*t,
   seg[2]+(seg[4]-seg[2])*t
  ];
 } else if(seg[0]===GraphicsPath.QUAD){
  var mt=1-t;
  var mtsq=mt*mt;
  var mt2=(mt+mt);
  a=seg[1]*mtsq;
  b=seg[3]*mt2;
  x=a+t*(b+t*seg[5]);
  a=seg[2]*mtsq;
  b=seg[4]*mt2;
  y=a+t*(b+t*seg[6]);
  return [x,y];
 } else if(seg[0]===GraphicsPath.CUBIC){
  a=(seg[3]-seg[1])*3;
  b=(seg[5]-seg[3])*3-a;
  var c=seg[7]-a-b-seg[1];
  x=seg[1]+t*(a+t*(b+t*c));
  a=(seg[4]-seg[2])*3;
  b=(seg[6]-seg[4])*3-a;
  c=seg[8]-a-b-seg[2];
  y=seg[2]+t*(a+t*(b+t*c));
  return [x,y];
 } else if(seg[0]===GraphicsPath.ARC){
  if(t===0)return [seg[1],seg[2]];
  if(t===1)return [seg[8],seg[9]];
  var rx=seg[3];
  var ry=seg[4];
  var cx=seg[10];
  var cy=seg[11];
  var theta=seg[12];
  var delta=(seg[13]-seg[12]);
  var rot=seg[5];
  var angle=theta+delta*t;
  var cr = Math.cos(rot);
  var sr = (rot>=0 && rot<6.283185307179586) ? (rot<=3.141592653589793 ? Math.sqrt(1.0-cr*cr) : -Math.sqrt(1.0-cr*cr)) : Math.sin(rot);
  var ca = Math.cos(angle);
  var sa = (angle>=0 && angle<6.283185307179586) ? (angle<=3.141592653589793 ? Math.sqrt(1.0-ca*ca) : -Math.sqrt(1.0-ca*ca)) : Math.sin(angle);
  return [
   cr*ca*rx-sr*sa*ry+cx,
   sr*ca*rx+cr*sa*ry+cy];
 } else {
  return [0,0];
 }
};

/** @private */
GraphicsPath._subdivide2=function(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,tcut,list,flatness,mode,depth){
   "use strict";
var x1=a1+(a3-a1)*tcut;
   var x2=a3+(a5-a3)*tcut;
   var xc1=x1+(x2-x1)*tcut;
   var x3=a5+(a7-a5)*tcut;
   var xc2=x2+(x3-x2)*tcut;
   var xd=xc1+(xc2-xc1)*tcut;
   var y1=a2+(a4-a2)*tcut;
   var y2=a4+(a6-a4)*tcut;
   var yc1=y1+(y2-y1)*tcut;
   var y3=a6+(a8-a6)*tcut;
   var yc2=y2+(y3-y2)*tcut;
   var yd=yc1+(yc2-yc1)*tcut;
   var tmid=t1+(t2-t1)*tcut;
   GraphicsPath._flattenCubic(a1,a2,x1,y1,xc1,yc1,xd,yd,t1,tmid,list,flatness,mode,depth+1);
   GraphicsPath._flattenCubic(xd,yd,xc2,yc2,x3,y3,a7,a8,tmid,t2,list,flatness,mode,depth+1);
};
/** @private */
GraphicsPath._subdivide3=function(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,tcut,tcut2,list,flatness,mode,depth){
   "use strict";
var x1=a1+(a3-a1)*tcut;
   var x2=a3+(a5-a3)*tcut;
   var xc1=x1+(x2-x1)*tcut;
   var x3=a5+(a7-a5)*tcut;
   var xc2=x2+(x3-x2)*tcut;
   var xd=xc1+(xc2-xc1)*tcut;
   var y1=a2+(a4-a2)*tcut;
   var y2=a4+(a6-a4)*tcut;
   var yc1=y1+(y2-y1)*tcut;
   var y3=a6+(a8-a6)*tcut;
   var yc2=y2+(y3-y2)*tcut;
   var yd=yc1+(yc2-yc1)*tcut;
   var tmid=t1+(t2-t1)*tcut;
   var tcutx=(tcut2-tmid)/(t2-tmid);
   GraphicsPath._flattenCubic(a1,a2,x1,y1,xc1,yc1,xd,yd,t1,tmid,list,flatness,mode,depth+1);
   GraphicsPath._subdivide2(xd,yd,xc2,yc2,x3,y3,a7,a8,tmid,t2,tcutx,list,flatness,mode,depth+1);
};

GraphicsPath._flattenCubic=function(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,list,flatness,mode,depth){
 "use strict";
if((depth===null || typeof depth==="undefined"))depth=0;
 /* if(depth<1){
  // subdivide the curve at the inflection points
  var ax=a1-3*a3+3*a5-a7
  var ay=a2-3*a4+3*a6-a8
  var tx=(ax === 0) ? -1 : (a1-2*a3+a5)/ax
  var ty=(ay === 0) ? -1 : (a2-2*a4+a6)/ay
  if(tx>=1)tx=-1
  if(ty>=1)ty=-1
  if(tx>0 && ty>0){
   var tmin=Math.min(tx,ty)
   var tmax=Math.max(tx,ty)
   GraphicsPath._subdivide3(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,tmin,tmax,list,flatness,mode,depth)
   return
  } else if(tx>0){
   GraphicsPath._subdivide2(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,tx,list,flatness,mode,depth)
   return
  } else if(ty>0){
   GraphicsPath._subdivide2(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,ty,list,flatness,mode,depth)
   return
  }
 }*/
 if(depth>=20 || Math.abs(a1-a3-a3+a5)+Math.abs(a3-a5-a5+a7)+
    Math.abs(a2-a4-a4+a6)+Math.abs(a4-a6-a6+a8)<=flatness){
  if(mode === 0){
   list.push([a1,a2,a7,a8]);
  } else {
   var dx=a7-a1;
   var dy=a8-a2;
   var length=Math.sqrt(dx*dx+dy*dy);
   list.push(t1,t2,length);
  }
 } else {
  GraphicsPath._subdivide2(a1,a2,a3,a4,a5,a6,a7,a8,t1,t2,0.5,list,flatness,mode,depth);
 }
};

GraphicsPath._flattenQuad=function(a1,a2,a3,a4,a5,a6,t1,t2,list,flatness,mode,depth){
 "use strict";
if((depth===null || typeof depth==="undefined"))depth=0;
 if(depth>=20 || Math.abs(a1-a3-a3+a5)+Math.abs(a2-a4-a4+a6)<=flatness){
  if(mode === 0){
   list.push([a1,a2,a5,a6]);
  } else {
   var dx=a5-a1;
   var dy=a6-a2;
   var length=Math.sqrt(dx*dx+dy*dy);
   list.push(t1,t2,length);
  }
 } else {
  var x1=(a1+a3)*0.5;
  var x2=(a3+a5)*0.5;
  var xc=(x1+x2)*0.5;
  var y1=(a2+a4)*0.5;
  var y2=(a4+a6)*0.5;
  var yc=(y1+y2)*0.5;
  var tmid=(t1+t2)*0.5;
  GraphicsPath._flattenQuad(a1,a2,x1,y1,xc,yc,t1,tmid,list,flatness,mode,depth+1);
  GraphicsPath._flattenQuad(xc,yc,x2,y2,a5,a6,tmid,t2,list,flatness,mode,depth+1);
 }
};

GraphicsPath._flattenArc=function(a,t1,t2,list,flatness,mode,depth){
 "use strict";
var rot=a[5];
 var crot = Math.cos(rot);
 var srot = (rot>=0 && rot<6.283185307179586) ? (rot<=3.141592653589793 ? Math.sqrt(1.0-crot*crot) : -Math.sqrt(1.0-crot*crot)) : Math.sin(rot);
 var ellipseInfo=[a[3],a[4],a[10],a[11],crot,srot];
 GraphicsPath._flattenArcInternal(ellipseInfo,a[1],a[2],a[8],a[9],a[12],a[13],t1,t2,list,flatness,mode,depth);
};
GraphicsPath._flattenArcInternal=function(ellipseInfo,x1,y1,x2,y2,theta1,theta2,t1,t2,list,flatness,mode,depth){
 "use strict";
if((depth===null || typeof depth==="undefined"))depth=0;
 var thetaMid=(theta1+theta2)*0.5;
 var tmid=(t1+t2)*0.5;
 var ca = Math.cos(thetaMid);
 var sa = (thetaMid>=0 && thetaMid<6.283185307179586) ? (thetaMid<=3.141592653589793 ? Math.sqrt(1.0-ca*ca) : -Math.sqrt(1.0-ca*ca)) : Math.sin(thetaMid);
 var xmid = ellipseInfo[4]*ca*ellipseInfo[0]-ellipseInfo[5]*sa*ellipseInfo[1]+ellipseInfo[2];
 var ymid = ellipseInfo[5]*ca*ellipseInfo[0]+ellipseInfo[4]*sa*ellipseInfo[1]+ellipseInfo[3];
 if(depth>=20 || Math.abs(x1-xmid-xmid+x2)+Math.abs(y1-ymid-ymid+y2)<=flatness){
  if(mode === 0){
   list.push([x1,y1,xmid,ymid]);
   list.push([xmid,ymid,x2,y2]);
  } else {
   var dx=xmid-x1;
   var dy=ymid-y1;
   var length=Math.sqrt(dx*dx+dy*dy);
   list.push(t1,tmid,length);
   dx=x2-xmid;
   dy=y2-ymid;
   length=Math.sqrt(dx*dx+dy*dy);
   list.push(tmid,t2,length);
  }
 } else {
  GraphicsPath._flattenArcInternal(ellipseInfo,x1,y1,xmid,ymid,theta1,thetaMid,t1,tmid,list,flatness,mode,depth+1);
  GraphicsPath._flattenArcInternal(ellipseInfo,xmid,ymid,x2,y2,thetaMid,theta2,tmid,t2,list,flatness,mode,depth+1);
 }
};
/** @private */
GraphicsPath.prototype._start=function(){
 "use strict";
for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  if(s[0]!==GraphicsPath.CLOSE)return GraphicsPath._startPoint(s);
 }
 return [0,0];
};
/** @private */
GraphicsPath.prototype._end=function(){
 "use strict";
for(var i=this.segments.length-1;i>=0;i--){
  var s=this.segments[i];
  if(s[0]!==GraphicsPath.CLOSE)return GraphicsPath._endPoint(s);
 }
 return [0,0];
};
/**
 * Returns this path in the form of a string in SVG path format.
 * See {@link GraphicsPath.fromString}.
 * @return {string} A string describing the path in the SVG path
  format. */
GraphicsPath.prototype.toString=function(){
 "use strict";
 var oldpos=null;
 var ret="";
 var lastcommand=-1;
 for(var i=0;i<this.segments.length;i++){
  var a=this.segments[i];
  if(a[0]===GraphicsPath.CLOSE){
   ret+="Z";
  } else {
   var start=GraphicsPath._startPoint(a);
   if(!oldpos || oldpos[0]!==start[0] || oldpos[1]!==start[1]){
    ret+="M"+start[0]+","+start[1];
   }
   oldpos=GraphicsPath._endPoint(a);
   if(a[0]===GraphicsPath.LINE){
    ret+="L"+a[3]+","+a[4];
   }
   if(a[0]===GraphicsPath.QUAD){
    ret+="Q"+a[3]+","+a[4]+","+a[5]+","+a[6];
   }
   if(a[0]===GraphicsPath.CUBIC){
    ret+="C"+a[3]+","+a[4]+","+a[5]+","+a[6]+","+a[7]+","+a[8];
   }
   if(a[0]===GraphicsPath.ARC){
    ret+="A"+a[3]+","+a[4]+","+(a[5]*180/Math.PI)+","+
      (a[6] ? "1" : "0")+(a[7] ? "1" : "0")+a[8]+","+a[9];
   }
  }
 }
 return ret;
};
GraphicsPath._quadCurveLength=function(x1,y1,x2,y2,x3,y3){
 "use strict";
var integrand=function(t){
  var tm1=t-1;
  var x=x1*tm1-x2*tm1-x2*t+x3*t;
  var y=y1*tm1-y2*tm1-y2*t+y3*t;
  return Math.sqrt(4*x*x+4*y*y);
 };
 return GraphicsPath._numIntegrate(integrand,0,1);
};
GraphicsPath._cubicCurveLength=function(x1,y1,x2,y2,x3,y3,x4,y4){
 "use strict";
var integrand=function(t){
  var tm1=t-1;
  var tm1sq=tm1*tm1;
  var c = x3-x4;
  var b = 2*x3*tm1-2*x2*tm1;
  var a = x1*tm1sq-x2*tm1sq;
  var x = a+t*(b+t*c);
  c = y3-y4;
  b = 2*y3*tm1-2*y2*tm1;
  a = y1*tm1sq-y2*tm1sq;
  var y = a+t*(b+t*c);
  return Math.sqrt(9*x*x+9*y*y);
 };
 return GraphicsPath._numIntegrate(integrand,0,1);
};
GraphicsPath._length=function(a){
 "use strict";
 var flat,len,j;
if(a[0]===GraphicsPath.LINE){
  var dx=a[3]-a[1];
  var dy=a[4]-a[2];
  return Math.sqrt(dx*dx+dy*dy);
 } else if(a[0]===GraphicsPath.QUAD){
   return GraphicsPath._quadCurveLength(a[1],a[2],a[3],a[4],
     a[5],a[6]);
  } else if(a[0]===GraphicsPath.CUBIC){
   flat=[];
   len=0;
   return GraphicsPath._cubicCurveLength(a[1],a[2],a[3],a[4],
     a[5],a[6],a[7],a[8]);
 } else if(a[0]===GraphicsPath.ARC){
  var rx=a[3];
  var ry=a[4];
  var theta=a[12];
  var theta2=a[13];
  return GraphicsPath._ellipticArcLength(rx,ry,theta,theta2);
 } else {
  return 0;
 }
};

/**
 * Finds the approximate length of this path.
* @param {number} [flatness] No longer used by this method.
 * @return {number} Approximate length of this path
 * in units.
 */
GraphicsPath.prototype.pathLength=function(flatness){
 "use strict";
if(this.segments.length === 0)return 0;
 var totalLength=0;
 if((flatness===null || typeof flatness==="undefined"))flatness=1.0;
 for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  var len=GraphicsPath._length(s);
  totalLength+=len;
 }
 return totalLength;
};
/**
* Gets an array of line segments approximating
* the path.
* @param {number} [flatness] When curves and arcs
* are decomposed to line segments, the
* segments will be close to the true path of the curve by this
* value, given in units.  If null or omitted, default is 1.
* @return {Array<Array<number>>} Array of line segments.
* Each line segment is an array of four numbers: the X and
* Y coordinates of the start point, respectively, then the X and
* Y coordinates of the end point, respectively.
*/
GraphicsPath.prototype.getLines=function(flatness){
 "use strict";
var ret=[];
 if((flatness===null || typeof flatness==="undefined"))flatness=1.0;
 for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  var len=0;
  if(s[0]===GraphicsPath.QUAD){
   GraphicsPath._flattenQuad(s[1],s[2],s[3],s[4],
     s[5],s[6],0.0,1.0,ret,flatness*2,0);
  } else if(s[0]===GraphicsPath.CUBIC){
   GraphicsPath._flattenCubic(s[1],s[2],s[3],s[4],
     s[5],s[6],s[7],s[8],0.0,1.0,ret,flatness*2,0);
  } else if(s[0]===GraphicsPath.ARC){
   GraphicsPath._flattenArc(s,0.0,1.0,ret,flatness*2,0);
  } else if(s[0]!==GraphicsPath.CLOSE){
   ret.push([s[1],s[2],s[3],s[4]]);
  }
 }
 return ret;
};
/**
* Creates a path in which curves and arcs are decomposed
* to line segments.
* @param {number} [flatness] When curves and arcs
* are decomposed to line segments, the
* segments will be close to the true path of the curve by this
* value, given in units.  If null or omitted, default is 1.
* @return {GraphicsPath} A path consisting only of line
* segments and close commands.
 */
GraphicsPath.prototype.toLinePath=function(flatness){
 "use strict";
 var ret=[];
 var path=new GraphicsPath();
 var last=null;
 if((flatness===null || typeof flatness==="undefined"))flatness=1.0;
 for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  var len=0;
  if(s[0]===GraphicsPath.CLOSE){
   path.closePath();
   continue;
  }
  var j;
  var endpt=GraphicsPath._endPoint(s);
  var startpt=GraphicsPath._startPoint(s);
  if(!last || last[0]!==startpt[0] || last[1]!==startpt[1]){
   path.moveTo(startpt[0],startpt[1]);
  }
  last=endpt;
  ret.splice(0,ret.length);
  if(s[0]===GraphicsPath.QUAD){
   GraphicsPath._flattenQuad(s[1],s[2],s[3],s[4],
     s[5],s[6],0.0,1.0,ret,flatness*2,0);
   for(j=0;j<ret.length;j++){
    path.lineTo(ret[j][2],ret[j][3]);
   }
  } else if(s[0]===GraphicsPath.CUBIC){
   GraphicsPath._flattenCubic(s[1],s[2],s[3],s[4],
     s[5],s[6],s[7],s[8],0.0,1.0,ret,flatness*2,0);
   for(j=0;j<ret.length;j++){
    path.lineTo(ret[j][2],ret[j][3]);
   }
  } else if(s[0]===GraphicsPath.ARC){
   GraphicsPath._flattenArc(s,0.0,1.0,ret,flatness*2,0);
   for(j=0;j<ret.length;j++){
    path.lineTo(ret[j][2],ret[j][3]);
   }
  } else if(s[0]!==GraphicsPath.CLOSE){
   path.lineTo(s[3],s[4]);
  } else {
   path.closePath();
  }
 }
 return path;
};
GraphicsPath._accBounds=function(ret,first,s,t){
 "use strict";
if(t>=0 && t<=1){
  var pt=GraphicsPath._point(s,t);
  if(first){
   ret[0]=ret[2]=pt[0];
   ret[1]=ret[3]=pt[1];
  } else {
   ret[0]=Math.min(pt[0],ret[0]);
   ret[1]=Math.min(pt[1],ret[1]);
   ret[2]=Math.max(pt[0],ret[2]);
   ret[3]=Math.max(pt[1],ret[3]);
  }
 }
};
GraphicsPath._accBoundsArc=function(ret,first,rx,ry,cphi,sphi,cx,cy,angle){
 "use strict";
var ca = Math.cos(angle);
 var sa = (angle>=0 && angle<6.283185307179586) ? (angle<=3.141592653589793 ? Math.sqrt(1.0-ca*ca) : -Math.sqrt(1.0-ca*ca)) : Math.sin(angle);
 var px=cphi*ca*rx-sphi*sa*ry+cx;
 var py=sphi*ca*rx+cphi*sa*ry+cy;
 if(first){
  ret[0]=ret[2]=px;
  ret[1]=ret[3]=py;
 } else {
  ret[0]=Math.min(px,ret[0]);
  ret[1]=Math.min(py,ret[1]);
  ret[2]=Math.max(px,ret[2]);
  ret[3]=Math.max(py,ret[3]);
 }
};
GraphicsPath._normAngle=function(angle){
 "use strict";
var twopi=Math.PI*2;
 var normAngle=angle;
 if(normAngle>=0){
  normAngle=(normAngle<twopi) ? normAngle : normAngle%twopi;
 } else {
  normAngle%=twopi;
  normAngle+=twopi;
 }
 return normAngle;
};
GraphicsPath._angleInRange=function(angle,startAngle,endAngle){
 "use strict";
var twopi=Math.PI*2;
 var diff=endAngle-startAngle;
 if(Math.abs(diff)>=twopi)return true;
 var normAngle=GraphicsPath._normAngle(angle);
 var normStart=GraphicsPath._normAngle(startAngle);
 var normEnd=GraphicsPath._normAngle(endAngle);
 if(startAngle===endAngle){
  return normAngle===normStart;
 } else if(startAngle<endAngle){
  if(normStart<normEnd){
   return normAngle>=normStart && normAngle<=normEnd;
  } else {
   return normAngle>=normStart || normAngle<=normEnd;
  }
 } else {
  if(normEnd<normStart){
   return normAngle>=normEnd && normAngle<=normStart;
  } else {
   return normAngle>=normEnd || normAngle<=normStart;
  }
 }
};
/**
* Calculates an axis-aligned bounding box that tightly
* fits this graphics path.
* @return {Array<number>} An array of four numbers
* describing the bounding box.  The first two are
* the lowest X and Y coordinates, and the last two are
* the highest X and Y coordinates.  If the path is empty,
* returns the array (Infinity, Infinity, -Infinity, -Infinity).
*/
GraphicsPath.prototype.getBounds=function(){
 "use strict";
var inf=Number.POSITIVE_INFINITY;
 var ret=[inf,inf,-inf,inf];
 var first=true;
 for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  var len=0;
  var ax,ay;
  if(s[0]===GraphicsPath.CLOSE)continue;
  var endpt=GraphicsPath._endPoint(s);
  var x1=s[1],y1=s[2],x2=endpt[0],y2=endpt[1];
  if(first){
    ret[0]=Math.min(x1,x2);
    ret[1]=Math.min(y1,y2);
    ret[2]=Math.max(x1,x2);
    ret[3]=Math.max(y1,y2);
  } else {
    ret[0]=Math.min(x1,x2,ret[0]);
    ret[1]=Math.min(y1,y2,ret[1]);
    ret[2]=Math.max(x1,x2,ret[2]);
    ret[3]=Math.max(y1,y2,ret[3]);
  }
  first=false;
  if(s[0]===GraphicsPath.QUAD){
   x2=s[5];
   y2=s[6];
   ax=x1-2*s[3]+x2;
   ay=y1-2*s[4]+y2;
   if(ax!==0){
    GraphicsPath._accBounds(ret,first,s,(x1-s[3])/ax);
   }
   if(ay!==0){
    GraphicsPath._accBounds(ret,first,s,(y1-s[4])/ay);
   }
  } else if(s[0]===GraphicsPath.CUBIC){
   x2=s[7];
   y2=s[8];
   var denomX=x1-3*s[3]+3*s[5]-x2;
   var denomY=y1-3*s[4]+3*s[6]-y2;
   if(denomX!==0 || denomY!==0){
    ax=x1-2*s[3]+s[5];
    ay=y1-2*s[4]+s[6];
    var bx=s[3]*s[3]+s[5]*s[5]-s[5]*(x1+s[3])+x2*(x1-s[3]);
    var by=s[4]*s[4]+s[6]*s[6]-s[6]*(y1+s[4])+y2*(y1-s[4]);
    if(bx>=0 && denomX!==0){
     bx=Math.sqrt(bx);
     GraphicsPath._accBounds(ret,first,s,(ax-bx)/denomX);
     GraphicsPath._accBounds(ret,first,s,(ax+bx)/denomX);
    }
    if(by>=0 && denomY!==0){
     by=Math.sqrt(by);
     GraphicsPath._accBounds(ret,first,s,(ay-by)/denomY);
     GraphicsPath._accBounds(ret,first,s,(ay+by)/denomY);
    }
   }
  } else if(s[0]===GraphicsPath.ARC){
    var rx=s[3];
    var ry=s[4];
    var cx=s[10];
    var cy=s[11];
    var theta=s[12];
    var delta=s[13];
    var rot=s[5];
    var cosp = Math.cos(rot);
    var sinp = (rot>=0 && rot<6.283185307179586) ? (rot<=3.141592653589793 ? Math.sqrt(1.0-cosp*cosp) : -Math.sqrt(1.0-cosp*cosp)) : Math.sin(rot);
    var angles=[];
    var angle;
    if(cosp!==0 && sinp!==0){
     angle=Math.atan2(-ry*sinp/cosp,rx);
     angles.push(angle,angle+Math.PI);
     angle=Math.atan2(ry*cosp/sinp,rx);
     angles.push(angle,angle+Math.PI);
    } else {
     angles.push(0,Math.PI,Math.PI*0.5,Math.PI*1.5);
    }
    for(var k=0;k<angles.length;k++){
     if(GraphicsPath._angleInRange(angles[k],theta,delta)){
       GraphicsPath._accBoundsArc(ret,first,rx,ry,cosp,sinp,cx,cy,angles[k]);
     }
    }
  }
 }
 return ret;
};

/** @private */
GraphicsPath.prototype._getSubpaths=function(flatness){
 "use strict";
var tmp=[];
 var subpaths=[];
 var j;
 if((flatness===null || typeof flatness==="undefined"))flatness=1.0;
 var lastptx=0;
 var lastpty=0;
 var first=true;
 var curPath=null;
 for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  var len=0;
  var startpt=GraphicsPath._startPoint(s);
  var endpt=GraphicsPath._endPoint(s);
  tmp.splice(0,tmp.length);
  if(s[0]!==GraphicsPath.CLOSE){
   if(first || lastptx!==startpt[0] || lastpty!==startpt[1]){
    curPath=startpt;
    subpaths.push(curPath);
    first=false;
   }
   lastptx=endpt[0];
   lastpty=endpt[1];
  }
  if(s[0]===GraphicsPath.QUAD){
   GraphicsPath._flattenQuad(s[1],s[2],s[3],s[4],
     s[5],s[6],0.0,1.0,tmp,flatness*2,0);
   for(j=0;j<tmp.length;j++){
    curPath.push(tmp[j][2]);
    curPath.push(tmp[j][3]);
   }
  } else if(s[0]===GraphicsPath.CUBIC){
   GraphicsPath._flattenCubic(s[1],s[2],s[3],s[4],
     s[5],s[6],s[7],s[8],0.0,1.0,tmp,flatness*2,0);
   for(j=0;j<tmp.length;j++){
    curPath.push(tmp[j][2]);
    curPath.push(tmp[j][3]);
   }
  } else if(s[0]===GraphicsPath.ARC){
   GraphicsPath._flattenArc(s,0.0,1.0,tmp,flatness*2,0);
   for(j=0;j<tmp.length;j++){
    curPath.push(tmp[j][2]);
    curPath.push(tmp[j][3]);
   }
  } else if(s[0]!==GraphicsPath.CLOSE){
   curPath.push(s[3]);
   curPath.push(s[4]);
  }
 }
 return subpaths;
};

/**
* Converts the subpaths in this path to triangles.
* Treats each subpath as a polygon even if it isn't closed.
* Each subpath should currently be a simple polygon (one without
* self-intersections, duplicate vertices, or holes), except if the
* subpath contains duplicate vertices that appear at the start and end.
* @param {number} [flatness] When curves and arcs
* are decomposed to line segments, the
* segments will be close to the true path of the curve by this
* value, given in units.  If null or omitted, default is 1.
* @return {Array<Array<number>>} Array of six-element
* arrays describing a single triangle.  For each six-element
* array, the first two, next two, and last two numbers each
* describe a vertex position of that triangle (X and Y coordinates
* in that order).
*/
GraphicsPath.prototype.getTriangles=function(flatness){
 "use strict";
var subpaths=this._getSubpaths(flatness);
 var tris=[];
 for(var i=0;i<subpaths.length;i++){
  Triangulate._triangulate(subpaths[i],tris);
 }
 return tris;
};
GraphicsPath._CurveList=function(curves){
 "use strict";
this.curves=curves;
 this.cumulativeLengths=[];
 var totalLength=0;
 for(var i=0;i<this.curves.length;i++){
  this.cumulativeLengths.push(totalLength);
  totalLength+=this.curves[i].totalLength;
 }
 this.totalLength=totalLength;
};
GraphicsPath._CurveList.prototype.getCurves=function(){
 "use strict";
return this.curves;
};
GraphicsPath._CurveList.prototype.getLength=function(){
 "use strict";
return this.totalLength;
};
GraphicsPath._CurveList.prototype.evaluate=function(u){
 "use strict";
if(this.curves.length === 0)return [0,0,0];
 if(this.curves.length === 1)return this.curves[0].evaluate(u);
 if(u<0)u=0;
 if(u>1)u=1;
 var partialLen=u*this.totalLength;
 var left=0;
 var right=this.segments.length;
 while(left<=right){
  var mid=((left+right)/2)|0;
  var seg=this.curves[mid];
  var segstart=this.cumulativeLengths[mid];
  var segend=segstart+seg.totalLength;
  if((partialLen>=segstart && partialLen<segend) ||
     (partialLen===segend && mid+1===this.curves.length)){
   var t=(partialLen-segstart)/seg.totalLength;
   return seg.evaluate(t);
  } else if(partialLen<segstart){
   // curve is behind
   right=mid-1;
  } else {
   // curve is ahead
   left=mid+1;
  }
 }
 return null;
};

GraphicsPath._Curve=function(segments){
 "use strict";
this.segments=segments;
 var totalLength=0;
 var isClosed=false;
 for(var i=0;i<this.segments.length;i++){
  totalLength+=this.segments[i][1];
 }
 if(this.segments.length>0){
  var startpt=GraphicsPath._startPoint(this.segments[0][3]);
  var endpt=GraphicsPath._endPoint(this.segments[this.segments.length-1][3]);
  isClosed=(startpt[0]===endpt[0] && startpt[1]===endpt[1]);
 }
 this._isClosed=isClosed;
 this.totalLength=totalLength;
};
GraphicsPath._Curve.prototype.getLength=function(){
 "use strict";
return this.totalLength;
};
GraphicsPath._Curve.prototype.evaluate=function(u){
 "use strict";
if(this._isClosed){
  if(u<0)u+=Math.ceil(u);
  else if(u>1)u-=Math.floor(u);
 } else {
  if(u<0)u=0;
  else if(u>1)u=1;
 }
 if(this.segments.length === 0)return [0,0,0];
 var partialLen=u*this.totalLength;
 var left=0;
 var right=this.segments.length;
 while(left<=right){
  var mid=((left+right)/2)|0;
  var seg=this.segments[mid];
  var segstart=seg[2];
  var segend=segstart+seg[1];
  if((partialLen>=segstart && partialLen<segend) ||
     (partialLen===segend && mid+1===this.segments.length)){
   var seginfo=seg[3];
   var t=(u === 1) ? 1.0 : (partialLen-segstart)/seg[1];
   if(seg[0]===GraphicsPath.LINE){
    var x=seginfo[1]+(seginfo[3]-seginfo[1])*t;
    var y=seginfo[2]+(seginfo[4]-seginfo[2])*t;
    return [x,y,0];
   } else {
    var cumulativeLengths=seg[5];
    var segParts=seg[4];
    var segPartialLen=partialLen-segstart;
    var segLeft=0;
    var segRight=cumulativeLengths.length;
    while(segLeft<=segRight){
     var segMid=((segLeft+segRight)/2)|0;
     var partStart=cumulativeLengths[segMid];
     var partIndex=segMid*3;
     var partLength=segParts[partIndex+2];
     var partEnd=partStart+partLength;
     if(segPartialLen>=partStart && segPartialLen<=partEnd){
      var tStart=segParts[partIndex];
      var tEnd=segParts[partIndex+1];
      var partT=(u === 1) ? 1.0 : tStart+((segPartialLen-partStart)/partLength)*(tEnd-tStart);
      var point=GraphicsPath._point(seginfo,partT);
      point[2]=0;
      return point;
     } else if(segPartialLen<partStart){
      segRight=segMid-1;
     } else {
      segLeft=segMid+1;
     }
    }
    throw new Error("not implemented yet");
   }
  } else if(partialLen<segstart){
   // segment is behind
   right=mid-1;
  } else {
   // segment is ahead
   left=mid+1;
  }
 }
 return null;
};

/**
* Gets an object for the curves described by this path.
* The resulting object can be used to retrieve the points
* that lie on the path or as a parameter for one of
* the {@link CurveEval} methods, in the
* {@link CurveTube} class, or any other class that
* accepts parametric curves.<p>
* The return value doesn't track changes to the path.
* @param {number} [flatness] When curves and arcs
* are decomposed to line segments for the purpose of
* calculating their length, the
* segments will be close to the true path of the curve by this
* value, given in units.  If null or omitted, default is 1.  This
is only used to make the arc-length parameterization more
accurate if the path contains curves or arcs.
* @return {object} An object that implements
* the following methods:<ul>
<li><code>getCurves()</code> - Returns a list of curves described
* by this path.  The list will contain one object for each disconnected
portion of the path. For example, if the path contains one polygon, the list will contain
one curve object.   And if the path is empty, the list will be empty too.
<p>Each object will have the following methods:<ul>
<li><code>getLength()</code> - Returns the approximate total length of the curve,
in units.
<li><code>evaluate(u)</code> - Takes one parameter, "u", which
ranges from 0 to 1, depending on how far the point is from the start or
the end of the path (similar to arc-length parameterization).
The function returns a 3-element array containing
the X, Y, and Z coordinates of the point lying on the curve at the given
"u" position (however, the z will always be 0 since paths can currently
only be 2-dimensional).
</ul>
<li><code>getLength()</code> - Returns the approximate total length of the path,
in units.
<li><code>evaluate(u)</code> - Has the same effect as the "evaluate"
method for each curve, but applies to the path as a whole.
Note that calling this "evaluate" method is only
recommended when drawing the path as a set of points, not lines, since
the path may contain several disconnected parts.
</ul>
*/
GraphicsPath.prototype.getCurves=function(flatness){
 "use strict";
var subpaths=[];
 var curves=[];
 if((flatness===null || typeof flatness==="undefined"))flatness=1.0;
 var lastptx=0;
 var lastpty=0;
 var first=true;
 var curPath=null;
 var curLength=0;
 for(var i=0;i<this.segments.length;i++){
  var s=this.segments[i];
  var len=0;
  var startpt=GraphicsPath._startPoint(s);
  var endpt=GraphicsPath._endPoint(s);
  if(s[0]!==GraphicsPath.CLOSE){
   if(first || lastptx!==startpt[0] || lastpty!==startpt[1]){
    curPath=[];
    curLength=0;
    subpaths.push(curPath);
    first=false;
   }
   lastptx=endpt[0];
   lastpty=endpt[1];
  }
  if(s[0]===GraphicsPath.QUAD ||
      s[0]===GraphicsPath.CUBIC ||
      s[0]===GraphicsPath.ARC){
   var pieces=[];
   var cumulativeLengths=[];
   len=0;
   if(s[0]===GraphicsPath.QUAD){
    GraphicsPath._flattenQuad(s[1],s[2],s[3],s[4],
      s[5],s[6],0.0,1.0,pieces,flatness*2,1);
   } else if(s[0]===GraphicsPath.CUBIC){
    GraphicsPath._flattenCubic(s[1],s[2],s[3],s[4],
      s[5],s[6],s[7],s[8],0.0,1.0,pieces,flatness*2,1);
   } else if(s[0]===GraphicsPath.ARC){
    GraphicsPath._flattenArc(s,0.0,1.0,pieces,flatness*2,1);
   }
   for(var j=0;j<pieces.length;j+=3){
    cumulativeLengths.push(len);
    len+=pieces[j+2];
   }
   curPath.push([s[0],len,curLength,s.slice(0),pieces,cumulativeLengths]);
   curLength+=len;
  } else if(s[0]===GraphicsPath.LINE){
   var dx=s[3]-s[1];
   var dy=s[4]-s[2];
   len=Math.sqrt(dx*dx+dy*dy);
   curPath.push([s[0],len,curLength,s.slice(0)]);
   curLength+=len;
  }
 }
 for(i=0;i<subpaths.length;i++){
  curves.push(new GraphicsPath._Curve(subpaths[i]));
 }
 return new GraphicsPath._CurveList(curves);
};

/**
* Gets an array of points evenly spaced across the length
* of the path.
* @param {number} numPoints Number of points to return.
* @param {number} [flatness] When curves and arcs
* are decomposed to line segments for the purpose of
* calculating their length, the
* segments will be close to the true path of the curve by this
* value, given in units.  If null or omitted, default is 1.
* @return {Array<Array<number>>} Array of points lying on
* the path and evenly spaced across the length of the path,
* starting and ending with the path's endpoints.  Returns
* an empty array if <i>numPoints</i> is less than 1.  Returns
* an array consisting of the start point if <i>numPoints</i>
* is 1.
*/
GraphicsPath.prototype.getPoints=function(numPoints,flatness){
 "use strict";
if(numPoints<1)return [];
 if(numPoints === 1){
  return [this._start()];
 }
 if(numPoints === 2){
  return [this._start(),this._end()];
 }
 var curves=this.getCurves(flatness);
 var points=[];
 for(var i=0;i<numPoints;i++){
  var t=i/(numPoints-1);
  var ev=curves.evaluate(t);
  points.push([ev[0],ev[1]]);
 }
 return points;
};
/**
 * Makes this path closed.  Adds a line segment to the
 * path's start position, if necessary.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.closePath=function(){
 "use strict";
if(this.startPos[0]!==this.endPos[0] ||
   this.startPos[1]!==this.endPos[1]){
  this.lineTo(this.startPos[0],this.startPos[1]);
 }
 if(this.segments.length>0){
  this.segments.push([GraphicsPath.CLOSE]);
 }
 this.incomplete=false;
 return this;
};
/**
 * Moves the current start position and end position to the given position.
 * @param {number} x X-coordinate of the position.
 * @param {number} y Y-coordinate of the position.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.moveTo=function(x,y){
 "use strict";
this.startPos[0]=x;
 this.startPos[1]=y;
 this.endPos[0]=x;
 this.endPos[1]=y;
 this.incomplete=false;
 return this;
};
/**
 * Adds a line segment to the path, starting
 * at the path's end position, then
 * sets the end position to the end of the segment.
 * @param {number} x X-coordinate of the end of the line segment.
 * @param {number} y Y-coordinate of the end of the line segment.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.lineTo=function(x,y){
 "use strict";
this.segments.push([GraphicsPath.LINE,
  this.endPos[0],this.endPos[1],x,y]);
 this.endPos[0]=x;
 this.endPos[1]=y;
 this.incomplete=false;
 return this;
};

GraphicsPath._areCollinear=function(x0,y0,x1,y1,x2,y2){
  "use strict";
var t1 = x1 - x0;
  var t2 = y1 - y0;
  var t3 = [x2 - x0, y2 - y0];
  var denom=((t1 * t1) + t2 * t2);
  if(denom === 0){
   return true; // first two points are the same
  }
  var t4 = (((t1 * t3[0]) + t2 * t3[1]) / denom);
  var t5 = [(x0 + t4 * t1), (y0 + t4 * t2)];
  var t6 = [x2 - t5[0], y2 - t5[1]];
  return ((t6[0] * t6[0]) + t6[1] * t6[1]) === 0;
};
/**
 * Adds path segments in the form of a circular arc to this path,
 * using the parameterization specified in the "arcTo" method of the
 * HTML Canvas 2D Context.
 * @param {number} x1 X-coordinate of a point that, along with the
 * current end point, forms a tangent line.  The point where the
 * circle touches this tangent line is the start point of the arc, and if the
 * point isn't the same as the current end point, this method adds
 * a line segment connecting the two points.
 * @param {number} y1 Y-coordinate of the point described under "x1".
 * @param {number} x2 X-coordinate of a point that, along with the
 * point (x1, y1), forms a tangent line.  The point where the
 * circle touches this tangent line is the end point of the arc.
 * @param {number} y2 Y-coordinate of the point described under "x2".
 * @param {number} radius Radius of the circle the arc forms a part of.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.arcTo=function(x1,y1,x2,y2,radius){
 "use strict";
if(radius<0){
  throw new Error("IndexSizeError");
 }
 var x0=this.endPos[0];
 var y0=this.endPos[1];
 if(radius === 0 || (x0===x1 && y0===y1) || (x1===x2 && y1===y2) ||
   GraphicsPath._areCollinear(x0,y0,x1,y1,x2,y2)){
  return this.lineTo(x1,y1);
 }
  var t1 = [x0 - x1, y0 - y1];
  var t2 = 1.0/Math.sqrt(((t1[0] * t1[0]) + t1[1] * t1[1]));
  var t3 = [t1[0] * t2, t1[1] * t2]; // tangent vector from p1 to p0
  var t4 = [x2 - x1, y2 - y1];
  var t5 = 1.0/Math.sqrt(((t4[0] * t4[0]) + t4[1] * t4[1]));
  var t6 = [t4[0] * t5, t4[1] * t5]; // tangent vector from p2 to p1
  var cross = t3[0] * t6[1] - t3[1] * t6[0];
  var t7 = (((1.0 + ((t3[0] * t6[0]) + t3[1] * t6[1]))) * radius / Math.abs(cross));
  var t8 = [t3[0] * t7, t3[1] * t7];
  var t10 = [t6[0] * t7, t6[1] * t7];
  var startTangent = [x1 + t8[0], y1 + t8[1]];
  var endTangent = [x1 + t10[0], y1 + t10[1]];
  this.lineTo(startTangent[0],startTangent[1]);
  var sweep=(cross<0);
  return this.arcSvgTo(radius,radius,0,false,sweep,endTangent[0],endTangent[1]);
};
/**
 * Adds path segments in the form of a circular arc to this path,
 * using the parameterization specified in the "arc" method of the
 * HTML Canvas 2D Context.
 * @param {number} x X-coordinate of the center of the circle that the arc forms a part of.
 * @param {number} y Y-coordinate of the circle's center.
 * @param {number} radius Radius of the circle's center.
 * @param {number} startAngle Starting angle of the arc, in radians.
 * 0 means the positive X-axis, &pi;/2 means the positive Y-axis,
 * &pi; means the negative X-axis, and &pi;*1.5 means the negative Y-axis.
 * @param {number} endAngle Ending angle of the arc, in radians.
 * @param {boolean} ccw Whether the arc runs counterclockwise
 * (assuming the X axis points right and the Y axis points
 * down under the coordinate system).
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.arc=function(x,y,radius,startAngle,endAngle,ccw){
 "use strict";
if(radius<0){
  throw new Error("IndexSizeError");
 }
 var x0=this.endPos[0];
 var y0=this.endPos[1];
 var twopi=Math.PI*2;
 var startX=x+radius*Math.cos(startAngle);
 var startY=y+radius*Math.sin(startAngle);
 var endX=x+radius*Math.cos(endAngle);
 var endY=y+radius*Math.sin(endAngle);
 if((startX===endX && startY===endY) || radius === 0){
    return this.lineTo(startX,startY).lineTo(endX,endY);
 }
 if((!ccw && (endAngle-startAngle)>=twopi) ||
   (ccw && (startAngle-endAngle)>=twopi)){
    return this.lineTo(startX,startY)
       .arc(x,y,radius,startAngle,startAngle+Math.PI,ccw)
       .arc(x,y,radius,startAngle+Math.PI,startAngle+Math.PI*2,ccw)
       .lineTo(startX,startY);
} else {
 var delta=endAngle-startAngle;
 if(delta>=twopi || delta<0){
 var d=delta%twopi;
 if(d === 0 && delta!==0){
  return this.lineTo(startX,startY)
       .arc(x,y,radius,startAngle,startAngle+Math.PI,ccw)
       .arc(x,y,radius,startAngle+Math.PI,startAngle+Math.PI*2,ccw)
       .lineTo(startX,startY);
 }
 delta=d;
}
var largeArc=(Math.abs(delta)>Math.PI)^(ccw)^(startAngle>endAngle);
var sweep=(delta>0)^(ccw)^(startAngle>endAngle);
return this.lineTo(startX,startY)
      .arcSvgTo(radius,radius,0,largeArc,sweep,endX,endY);
 }
};

/**
 * Adds a quadratic B&eacute;zier curve to this path starting
 * at this path's current position.
 * @param {number} x X-coordinate of the curve's control point.
 * @param {number} y Y-coordinate of the curve's control point.
 * @param {number} x2 X-coordinate of the curve's end point.
 * @param {number} y2 Y-coordinate of the curve's end point.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.quadraticCurveTo=function(x,y,x2,y2){
 "use strict";
this.segments.push([GraphicsPath.QUAD,
  this.endPos[0],this.endPos[1],x,y,x2,y2]);
 this.endPos[0]=x2;
 this.endPos[1]=y2;
 this.incomplete=false;
 return this;
};
/**
 * Adds a cubic B&eacute;zier curve to this path starting
 * at this path's current position.
 * @param {number} x
 * @param {number} y
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3 X-coordinate of the curve's end point.
 * @param {number} y3 Y-coordinate of the curve's end point.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.bezierCurveTo=function(x,y,x2,y2,x3,y3){
 "use strict";
this.segments.push([GraphicsPath.CUBIC,
  this.endPos[0],this.endPos[1],x,y,x2,y2,x3,y3]);
 this.endPos[0]=x3;
 this.endPos[1]=y3;
 this.incomplete=false;
 return this;
};

GraphicsPath._legendreGauss24=[
0.12793819534675216, 0.06405689286260563,
0.1258374563468283, 0.1911188674736163,
0.12167047292780339, 0.3150426796961634,
0.1155056680537256, 0.4337935076260451,
0.10744427011596563, 0.5454214713888396,
0.09761865210411388, 0.6480936519369755,
0.08619016153195327, 0.7401241915785544,
0.0733464814110803, 0.820001985973903,
0.05929858491543678, 0.8864155270044011,
0.04427743881741981, 0.9382745520027328,
0.028531388628933663, 0.9747285559713095,
0.0123412297999872, 0.9951872199970213
];
/**
* Estimates the integral of a function.  The integral
* is the area between the function's graph and the X-axis,
* where areas above the X axis add to the integral, and areas
* below the X axis subtract from it.
* @private
* @param {Function} func A function that takes one number
* and returns a number.  For best results,
* the function should be continuous (informally, this means
* its graph between <code>xmin</code> and
* <code>xmax</code> can be drawn without lifting the pen).
* @param {Number} xmin Smallest input to the function,
* or the lower limit to integration.
* @param {Number} xmax Largest input to the function,
* or the upper limit to integration.  If xmax is less than xmin,
* this results in a negative integral.
* @returns The approximate integral of _func_ between
* _xmin_ and _xmax_.
*/
GraphicsPath._numIntegrate=function(func, xmin, xmax){
 "use strict";
if(xmax===xmin)return 0;
 if(xmax<xmin){
  return -GraphicsPath._numIntegrate(func,xmax,xmin);
 }
 var bm=(xmax-xmin)*0.5;
 var bp=(xmax+xmin)*0.5;
 var ret=0;
 var lg=GraphicsPath._legendreGauss24;
 for(var i=0;i<lg.length;i+=2){
  var weight=lg[i];
  var abscissa=lg[i+1];
  ret+=weight*func(bm*abscissa+bp);
  ret+=weight*func(-bm*abscissa+bp);
 }
 return ret*bm;
};

GraphicsPath._ellipticArcLength=function(xRadius,yRadius,startAngle,endAngle){
 "use strict";
if(startAngle===endAngle || xRadius<=0 || yRadius<=0)return 0;
 if(xRadius===yRadius){
  // for circular arc length this is extremely simple
  return Math.abs((endAngle-startAngle)*xRadius);
 }
 var mn=Math.min(xRadius,yRadius);
 var mx=Math.max(xRadius,yRadius);
 var eccSq=1-(mn*mn)/(mx*mx);
 var ellipticIntegrand=function(x){
  var s=Math.sin(x);
  return Math.sqrt(1-s*s*eccSq);
 };
 return Math.abs(mx*GraphicsPath._numIntegrate(
   ellipticIntegrand,startAngle,endAngle));
};
GraphicsPath._vecangle=function(a,b,c,d){
 "use strict";
var dot=a*c+b*d;
 var denom=Math.sqrt(a*a+b*b)*Math.sqrt(c*c+d*d);
 dot/=denom;
 var sgn=a*d-b*c;
 // avoid NaN when dot is just slightly out of range
 // for acos
 if(dot<-1)dot=-1;
 else if(dot>1)dot=1;
 var ret=Math.acos(dot);
 if(sgn<0)ret=-ret;
 return ret;
};
GraphicsPath._arcSvgToCenterParam=function(a){
 "use strict";
var x1=a[1];
 var y1=a[2];
 var x2=a[8];
 var y2=a[9];
 var rx=a[3];
 var ry=a[4];
 var rot=a[5];
 var xmid=(x1-x2)*0.5;
 var ymid=(y1-y2)*0.5;
 var xpmid=(x1+x2)*0.5;
 var ypmid=(y1+y2)*0.5;
 var crot = Math.cos(rot);
 var srot = (rot>=0 && rot<6.283185307179586) ? (rot<=3.141592653589793 ? Math.sqrt(1.0-crot*crot) : -Math.sqrt(1.0-crot*crot)) : Math.sin(rot);
 var x1p=crot*xmid+srot*ymid;
 var y1p=crot*ymid-srot*xmid;
 var rxsq=rx*rx;
 var rysq=ry*ry;
 var x1psq=x1p*x1p;
 var y1psq=y1p*y1p;
 var rx_xy=rxsq*y1psq+rysq*x1psq;
 var cxsqrt=Math.sqrt(Math.max(0,(rxsq*rysq-rx_xy)/rx_xy));
 var cxp=(rx*y1p)*cxsqrt/ry;
 var cyp=(ry*x1p)*cxsqrt/rx;
 if(a[6]===a[7]){
  cxp=-cxp;
 } else {
  cyp=-cyp;
 }
 var cx=crot*cxp-srot*cyp+xpmid;
 var cy=srot*cxp+crot*cyp+ypmid;
 var vecx=(x1p-cxp)/rx;
 var vecy=(y1p-cyp)/ry;
 var nvecx=(-x1p-cxp)/rx;
 var nvecy=(-y1p-cyp)/ry;
 var cosTheta1=vecx/Math.sqrt(vecx*vecx+vecy*vecy);
 // avoid NaN when cosTheta1 is just slightly out of range
 // for acos
 if(cosTheta1<-1)cosTheta1=-1;
 else if(cosTheta1>1)cosTheta1=1;
 var theta1=Math.acos(cosTheta1);
 if(vecy<0)theta1=-theta1;
 var delta=GraphicsPath._vecangle(vecx,vecy,nvecx,nvecy);
 delta=(delta<0) ? Math.PI*2+delta : delta;
 if(!a[7] && delta>0){
  delta-=Math.PI*2;
 } else if(a[7] && delta<0){
  delta+=Math.PI*2;
 }
 delta+=theta1;
 return [cx,cy,theta1,delta];
};

/**
 * Adds path segments in the form of an elliptical arc to this path,
 * using the parameterization used by the SVG specification.
 * @param {number} rx X-axis radius of the ellipse that the arc will
 * be formed from.
 * @param {number} ry Y-axis radius of the ellipse that the arc will
 * be formed from.
 * @param {number} rot Rotation of the ellipse in degrees (clockwise
 * assuming the X axis points right and the Y axis points
 * down under the coordinate system).
 * @param {boolean} largeArc In general, there are four possible solutions
 * for arcs given the start and end points, rotation, and x- and y-radii.  If true,
 * chooses an arc solution with the larger arc length; if false, smaller.
 * @param {boolean} sweep If true, the arc solution chosen will run
 * clockwise (assuming the X axis points right and the Y axis points
 * down under the coordinate system); if false, counterclockwise.
 * @param {number} x2 X-coordinate of the arc's end point.
 * @param {number} y2 Y-coordinate of the arc's end point.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.arcSvgTo=function(rx,ry,rot,largeArc,sweep,x2,y2){
 "use strict";
if(rx === 0 || ry === 0){
  return this.lineTo(x2,y2);
 }
 var x1=this.endPos[0];
 var y1=this.endPos[1];
 if(x1===x2 && y1===y2){
  return this;
 }
 rot%=360;
 rot*=Math.PI/180;
 rx=Math.abs(rx);
 ry=Math.abs(ry);
 var xmid=(x1-x2)*0.5;
 var ymid=(y1-y2)*0.5;
 var crot = Math.cos(rot);
 var srot = (rot>=0 && rot<6.283185307179586) ? (rot<=3.141592653589793 ? Math.sqrt(1.0-crot*crot) : -Math.sqrt(1.0-crot*crot)) : Math.sin(rot);
 var x1p=crot*xmid+srot*ymid;
 var y1p=crot*ymid-srot*xmid;
 var lam=(x1p*x1p)/(rx*rx)+(y1p*y1p)/(ry*ry);
 if(lam>1){
  lam=Math.sqrt(lam);
  rx*=lam;
  ry*=lam;
 }
 var arc=[GraphicsPath.ARC,
  x1,y1,rx,ry,rot,!!largeArc,!!sweep,x2,y2];
 var cp=GraphicsPath._arcSvgToCenterParam(arc);
 arc[10]=cp[0];
 arc[11]=cp[1];
 arc[12]=cp[2];
 arc[13]=cp[3];
 this.segments.push(arc);
 this.endPos[0]=x2;
 this.endPos[1]=y2;
 this.incomplete=false;
 return this;
};
GraphicsPath._nextAfterWs=function(str,index){
 "use strict";
while(index[0]<str.length){
  var c=str.charCodeAt(index[0]);
  index[0]++;
  if(c === 0x20 || c === 0x0d || c === 0x09 || c === 0x0a || c === 0x0c)
   continue;
  return c;
 }
 return -1;
};
GraphicsPath._nextAfterSepReq=function(str,index){
 "use strict";
var comma=false;
 var havesep=false;
 while(index[0]<str.length){
  var c=str.charCodeAt(index[0]);
  index[0]++;
  if(c === 0x20 || c === 0x0d || c === 0x09 || c === 0x0a || c === 0x0c){
   havesep=true;
   continue;
  }
  if(!comma && c === 0x2c){
   havesep=true;
   comma=true;
   continue;
  }
  return (!havesep) ? -1 : c;
 }
 return -1;
};
GraphicsPath._nextAfterSep=function(str,index){
 "use strict";
var comma=false;
 while(index[0]<str.length){
  var c=str.charCodeAt(index[0]);
  index[0]++;
  if(c === 0x20 || c === 0x0d || c === 0x09 || c === 0x0a || c === 0x0c)
   continue;
  if(!comma && c === 0x2c){
   comma=true;
   continue;
  }
  return c;
 }
 return -1;
};
GraphicsPath._peekNextNumber=function(str,index){
 "use strict";
var oldindex=index[0];
 var ret=GraphicsPath._nextNumber(str,index,true)!==null;
 index[0]=oldindex;
 return ret;
};
GraphicsPath._notFinite=function(n){
 "use strict";
return isNaN(n) || n===Number.POSITIVE_INFINITY ||
   n===Number.NEGATIVE_INFINITY;
};
GraphicsPath._nextNumber=function(str,index,afterSep){
 "use strict";
var oldindex=index[0];
 var c=(afterSep) ?
   GraphicsPath._nextAfterSep(str,index) :
   GraphicsPath._nextAfterWs(str,index);
 var startIndex=index[0]-1;
 var dot=false;
 var digit=false;
 var exponent=false;
 var ret;
 if(c === 0x2e)dot=true;
 else if(c>=0x30 && c<=0x39)digit=true;
 else if(c!==0x2d && c!==0x2b){
    index[0]=oldindex;
    return null;
   }
 while(index[0]<str.length){
  c=str.charCodeAt(index[0]);
  index[0]++;
  if(c === 0x2e){
   if(dot){
    index[0]=oldindex;
    return null;
   }
   dot=true;
  } else if(c>=0x30 && c<=0x39){
   digit=true;
  } else if(c === 0x45 || c === 0x65){
   if(!digit){
    index[0]=oldindex;
    return null;
   }
   exponent=true;
   break;
  } else {
   if(!digit){
    index[0]=oldindex;
    return null;
   }
   index[0]--;
   ret=parseFloat(str.substr(startIndex,index[0]-startIndex));
   if(GraphicsPath._notFinite(ret)){
    index[0]=oldindex;
    return null;
   }
   return ret;
  }
 }
 if(exponent){
  c=str.charCodeAt(index[0]);
  if(c<0){
    index[0]=oldindex;
    return null;
   }
  index[0]++;
  digit=false;
  if(c>=0x30 && c<=0x39)digit=true;
  else if(c!==0x2d && c!==0x2b){
    index[0]=oldindex;
    return null;
   }
  while(index[0]<str.length){
   c=str.charCodeAt(index[0]);
   index[0]++;
   if(c>=0x30 && c<=0x39){
    digit=true;
   } else {
    if(!digit){
    index[0]=oldindex;
    return null;
    }
    index[0]--;
    ret=parseFloat(str.substr(startIndex,index[0]-startIndex));
    if(GraphicsPath._notFinite(ret)){
     index[0]=oldindex;
     return null;
    }
    return ret;
   }
  }
  if(!digit){
    index[0]=oldindex;
    return null;
  }
 } else {
  if(!digit){
    index[0]=oldindex;
    return null;
  }
 }
 ret=parseFloat(str.substr(startIndex,str.length-startIndex));
 if(GraphicsPath._notFinite(ret)){
  index[0]=oldindex;
  return null;
 }
 return ret;
};
/**
 * Adds four lines in an axis-aligned rectangle shape to the path.
 * @param {number} x X-coordinate of a corner of the rectangle.
 * @param {number} y Y-coordinate of a corner of the rectangle.
 * @param {number} width X-offset (width) to another corner of the rectangle.
 * @param {number} height Y-offset (height) to another corner of the rectangle.
 * @return {GraphicsPath} This object.
 */
GraphicsPath.prototype.rect=function(x,y,width,height){
 "use strict";
return this.moveTo(x,y).lineTo(x+width,y).lineTo(x+width,y+height)
   .lineTo(x,y+height).closePath().moveTo(x,y);
};

/**
* Creates a graphics path from a string whose format follows
* the SVG specification.
* @param {string} str A string, in the SVG path format, representing
* a two-dimensional path.  An SVG path consists of a number of
* path segments, starting with a single letter, as follows:
* <ul>
* <li>M/m (x y) - Moves the current position to (x, y). Further
* XY pairs specify line segments.
* <li>L/l (x y) - Specifies line segments to the given XY points.
* <li>H/h (x) - Specifies horizontal line segments to the given X points.
* <li>V/v (y) - Specifies vertical line segments to the given Y points.
* <li>Q/q (cx cx x y) - Specifies quadratic B&eacute;zier curves
* (see quadCurveTo).
* <li>T/t (x y) - Specifies quadratic curves tangent to the previous
* quadratic curve.
* <li>C/c (c1x c1y c2x c2y x y) - Specifies cubic B&eacute;zier curves
* (see bezierCurveTo).
* <li>S/s (c2x c2y x y) - Specifies cubic curves tangent to the previous
* cubic curve.
* <li>A/a (rx ry rot largeArc sweep x y) - Specifies arcs (see arcSvgTo).
* "largeArc" and "sweep" are flags, "0" for false and "1" for true.
* "rot" is in degrees.
* <li>Z/z - Closes the current path; similar to adding a line segment
* to the first XY point given in the last M/m command.
* </ul>
* Lower-case letters mean any X and Y coordinates are relative
* to the current position of the path.  Each group of parameters
* can be repeated in the same path segment. Each parameter after
* the starting letter is separated by whitespace and/or a single comma,
* and the starting letter can be separated by whitespace.
* This separation can be left out as long as doing so doesn't
* introduce ambiguity.  All commands set the current point
* to the end of the path segment (including Z/z, which adds a line
* segment if needed).
* @return {GraphicsPath} The resulting path.  If an error
* occurs while parsing the path, the path's "isIncomplete() method
* will return <code>true</code>.
* @example <caption>The following example creates a graphics path
* from an SVG string describing a polyline.</caption>
* var path=GraphicsPath.fromString("M10,20L40,30,24,32,55,22")
*/
GraphicsPath.fromString=function(str){
 "use strict";
var index=[0];
 var started=false;
 var ret=new GraphicsPath();
 var failed=false;
 var endx,endy;
 var sep,curx,cury,x,y,curpt,x2,y2,xcp,ycp;
 while(!failed && index[0]<str.length){
  var c=GraphicsPath._nextAfterWs(str,index);
  if(!started && c!==0x4d && c!==0x6d){
   // not a move-to command when path
   // started
    failed=true;break;
  }
  // NOTE: Doesn't implement SVG2 meaning of Z
  // command yet because it's not yet fully specified
  switch(c){
   case 0x5a:case 0x7a:{ // 'Z', 'z'
    ret.closePath();
    break;
   }
   case 0x4d:case 0x6d:{ // 'M', 'm'
    sep=false;
    while(true){
     curx=(c === 0x6d) ? ret.endPos[0] : 0;
     cury=(c === 0x6d) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     if(sep)ret.lineTo(curx+x,cury+y);
     else ret.moveTo(curx+x,cury+y);
     sep=true;
    }
    started=true;
    break;
   }
   case 0x4c:case 0x6c:{ // 'L', 'l'
    sep=false;
    while(true){
     curx=(c === 0x6c) ? ret.endPos[0] : 0;
     cury=(c === 0x6c) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     ret.lineTo(curx+x,cury+y);
     sep=true;
    }
    break;
   }
   case 0x48:case 0x68:{ // 'H', 'h'
    sep=false;
    while(true){
     curpt=(c === 0x68) ? ret.endPos[0] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     ret.lineTo(curpt+x,ret.endPos[1]);
     sep=true;
    }
    break;
   }
   case 0x56:case 0x76:{ // 'V', 'v'
    sep=false;
    while(true){
     curpt=(c === 0x76) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     ret.lineTo(ret.endPos[0],curpt+x);
     sep=true;
    }
    break;
   }
   case 0x43:case 0x63:{ // 'C', 'c'
    sep=false;
    while(true){
     curx=(c === 0x63) ? ret.endPos[0] : 0;
     cury=(c === 0x63) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     x2=GraphicsPath._nextNumber(str,index,true);
     if((x2===null || typeof x2==="undefined")){ failed=true;break; }
     y2=GraphicsPath._nextNumber(str,index,true);
     if((y2===null || typeof y2==="undefined")){ failed=true;break; }
     var x3=GraphicsPath._nextNumber(str,index,true);
     if((x3===null || typeof x3==="undefined")){ failed=true;break; }
     var y3=GraphicsPath._nextNumber(str,index,true);
     if((y3===null || typeof y3==="undefined")){ failed=true;break; }
     ret.bezierCurveTo(curx+x,cury+y,curx+x2,cury+y2,
       curx+x3,cury+y3);
     sep=true;
    }
    break;
   }
   case 0x51:case 0x71:{ // 'Q', 'q'
    sep=false;
    while(true){
     curx=(c === 0x71) ? ret.endPos[0] : 0;
     cury=(c === 0x71) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     x2=GraphicsPath._nextNumber(str,index,true);
     if((x2===null || typeof x2==="undefined")){ failed=true;break; }
     y2=GraphicsPath._nextNumber(str,index,true);
     if((y2===null || typeof y2==="undefined")){ failed=true;break; }
     ret.quadraticCurveTo(curx+x,cury+y,curx+x2,cury+y2);
     sep=true;
    }
    break;
   }
   case 0x41:case 0x61:{ // 'A', 'a'
    sep=false;
    while(true){
     curx=(c === 0x61) ? ret.endPos[0] : 0;
     cury=(c === 0x61) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     var rot=GraphicsPath._nextNumber(str,index,true);
     if((rot===null || typeof rot==="undefined")){ failed=true;break; }
     var largeArc=GraphicsPath._nextAfterSepReq(str,index);
     var sweep=GraphicsPath._nextAfterSep(str,index);
     if(largeArc===-1 || sweep===-1){ failed=true;break; }
     x2=GraphicsPath._nextNumber(str,index,true);
     if((x2===null || typeof x2==="undefined")){ failed=true;break; }
     y2=GraphicsPath._nextNumber(str,index,true);
     if((y2===null || typeof y2==="undefined")){ failed=true;break; }
     ret.arcSvgTo(x+curx,y+cury,rot,largeArc!==0x30,
       sweep!==0x30,x2+curx,y2+cury);
     sep=true;
    }
    break;
   }
   case 0x53:case 0x73:{ // 'S', 's'
    sep=false;
    while(true){
     curx=(c === 0x73) ? ret.endPos[0] : 0;
     cury=(c === 0x73) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     x2=GraphicsPath._nextNumber(str,index,true);
     if((x2===null || typeof x2==="undefined")){ failed=true;break; }
     y2=GraphicsPath._nextNumber(str,index,true);
     if((y2===null || typeof y2==="undefined")){ failed=true;break; }
     xcp=ret.endPos[0];
     ycp=ret.endPos[1];
     endx=ret.endPos[0];
     endy=ret.endPos[1];
     if(ret.segments.length>0 &&
        ret.segments[ret.segments.length-1][0]===GraphicsPath.CUBIC){
        xcp=ret.segments[ret.segments.length-1][5];
        ycp=ret.segments[ret.segments.length-1][6];
     }
     ret.bezierCurveTo(2*endx-xcp,2*endy-ycp,x+curx,y+cury,x2+curx,y2+cury);
     sep=true;
    }
    break;
   }
   case 0x54:case 0x74:{ // 'T', 't'
    sep=false;
    while(true){
     curx=(c === 0x74) ? ret.endPos[0] : 0;
     cury=(c === 0x74) ? ret.endPos[1] : 0;
     x=GraphicsPath._nextNumber(str,index,sep);
     if((x===null || typeof x==="undefined")){ if(!sep)failed=true;break; }
     y=GraphicsPath._nextNumber(str,index,true);
     if((y===null || typeof y==="undefined")){ failed=true;break; }
     xcp=ret.endPos[0];
     ycp=ret.endPos[1];
     endx=ret.endPos[0];
     endy=ret.endPos[1];
     if(ret.segments.length>0 &&
        ret.segments[ret.segments.length-1][0]===GraphicsPath.QUAD){
        xcp=ret.segments[ret.segments.length-1][3];
        ycp=ret.segments[ret.segments.length-1][4];
     }
     ret.quadraticCurveTo(2*endx-xcp,2*endy-ycp,x+curx,y+cury);
     sep=true;
    }
    break;
   }
   default:
    ret.incomplete=true;
    return ret;
  }
 }
 if(failed)ret.incomplete=true;
 return ret;
};

Triangulate._LinkedList=function(){
 "use strict";
this.items=[];
 this.firstItem=-1;
 this.lastItem=-1;
 this.lastRemovedIndex=-1;
};
Triangulate._LinkedList.prototype.list=function(list){
 "use strict";
var index=this.firstItem;
 var listidx=0;
 while(index>=0){
  list[listidx++]=this.items[index];
  index=this.items[index+2];
 }
 return listidx;
};
Triangulate._LinkedList.prototype.contains=function(item){
 "use strict";
var index=this.firstItem;
 while(index>=0){
  if(item===this.items[index])return true;
  index=this.items[index+2];
 }
 return false;
};
Triangulate._LinkedList.prototype.remove=function(item){
 "use strict";
var index=this.firstItem;
 while(index>=0){
  if(this.items[index]===item){
   this.lastRemovedIndex=index;
   var prevItem=this.items[index+1];
   var nextItem=this.items[index+2];
   if(prevItem>=0){
    this.items[prevItem+2]=nextItem;
   } else {
    this.firstItem=nextItem;
   }
   if(nextItem>=0){
    this.items[nextItem+1]=prevItem;
   } else {
    this.lastItem=prevItem;
   }
   return;
  }
  index=this.items[index+2];
 }
};
Triangulate._LinkedList.prototype.addIfMissing=function(item){
 "use strict";
if(!this.contains(item)){
  this.add(item);
 }
};
Triangulate._LinkedList.prototype.add=function(item){
 "use strict";
var itemIndex=(this.lastRemovedIndex===-1) ?
   this.items.length : this.lastRemovedIndex;
 this.lastRemovedIndex=-1;
 this.items[itemIndex]=item;
 if(this.lastItem>=0)
  this.items[this.lastItem+2]=itemIndex; // prev's next
 this.items[itemIndex+1]=this.lastItem; // current's prev
 this.items[itemIndex+2]=-1; // current's next
 this.lastItem=itemIndex;
 if(this.firstItem<0)this.firstItem=itemIndex;
};

Triangulate._CONVEX=1;
Triangulate._EAR=2;
Triangulate._REFLEX=3;
Triangulate._PREV=2;
Triangulate._NEXT=3;
Triangulate._pointInTri=function(vertices,i1,i2,i3,pt){
  "use strict";
var t1 = Math.min (vertices[i3+0], vertices[i1+0]);
  var t2 = Math.min (vertices[i3+1], vertices[i1+1]);
  var t=(((vertices[i1+0] < vertices[pt+0]) === (vertices[pt+0] <= vertices[i3+0])) &&
  (((vertices[pt+1] - t2) * (Math.max (vertices[i3+0], vertices[i1+0]) - t1)) < ((Math.max (vertices[i3+1], vertices[i1+1]) - t2) * (vertices[pt+0] - t1))));
  var t4 = Math.min (vertices[i1+0], vertices[i2+0]);
  var t5 = Math.min (vertices[i1+1], vertices[i2+1]);
  t^=(((vertices[i2+0] < vertices[pt+0]) === (vertices[pt+0] <= vertices[i1+0])) &&
   (((vertices[pt+1] - t5) * (Math.max (vertices[i1+0], vertices[i2+0]) - t4)) < ((Math.max (vertices[i1+1], vertices[i2+1]) - t5) * (vertices[pt+0] - t4))));
  var t7 = Math.min (vertices[i2+0], vertices[i3+0]);
  var t8 = Math.min (vertices[i2+1], vertices[i3+1]);
  t^=(((vertices[i3+0] < vertices[pt+0]) === (vertices[pt+0] <= vertices[i2+0])) &&
   (((vertices[pt+1] - t8) * (Math.max (vertices[i2+0], vertices[i3+0]) - t7)) < ((Math.max (vertices[i2+1], vertices[i3+1]) - t8) * (vertices[pt+0] - t7))));
  return t;
};

Triangulate._vertClass=function(verts,index,ori){
 "use strict";
var prevVert=verts[index+2];
 var nextVert=verts[index+3];
 var curori=Triangulate._triOrient(verts,prevVert,index,nextVert);
 if(curori === 0 || curori===ori){
  // This is a convex vertex, find out whether this
  // is an ear
  prevVert=verts[index+2];
  nextVert=verts[index+3];
  for(var i=0;i<verts.length;i+=4){
   if(i!==prevVert && i!==nextVert && i!==index){
    if(Triangulate._pointInTri(verts,prevVert,index,nextVert,i)){
     return Triangulate._CONVEX;
    }
   }
  }
  return Triangulate._EAR;
 } else {
  return Triangulate._REFLEX;
 }
};
Triangulate._triOrient=function(vertices,i1,i2,i3){
 "use strict";
var ori=vertices[i1]*vertices[i2+1]-vertices[i1+1]*vertices[i2];
 ori+=vertices[i3]*vertices[i1+1]-vertices[i1+1]*vertices[i1];
 return ori === 0 ? 0 : (ori<0 ? -1 : 1);
};
Triangulate._triangulate=function(vertices,tris){
 "use strict";
if(vertices.length<6){
  // too few vertices for a triangulation
  return;
 }
 var i;
 var vertLength=vertices.length;
 // For convenience, eliminate the last
 // vertex if it matches the first vertex
 if(vertLength>=4 &&
    vertices[0]===vertices[vertLength-2] &&
    vertices[1]===vertices[vertLength-1]){
  vertLength-=2;
 }
 if(vertLength === 6){
  // just one triangle
  tris.push(vertices.slice(0));
  return;
 }
 // Find the prevailing orientation of the polygon
 var ori=0;
 for(i=0;i<vertices.length;i+=2){
  if(i===vertices.length-2){
   ori+=vertices[i]*vertices[1]-vertices[i+1]*vertices[0];
  } else {
   ori+=vertices[i]*vertices[i+3]-vertices[i+1]*vertices[i+2];
  }
 }
 ori=(ori === 0) ? 0 : (ori<0 ? -1 : 1);
 if(ori === 0){
  // Zero area or even a certain self-intersecting
  // polygon
  return;
 }
 var verts=[];
 var tmp=[];
 var reflex=new Triangulate._LinkedList();
 var ears=new Triangulate._LinkedList();
 var lastX=-1;
 var lastY=-1;
 var prevVert,nextVert;
 for(i=0;i<vertLength;i+=2){
  var x=vertices[i];
  var y=vertices[i+1];
  if(i>0 && x===lastX && y===lastY){
   // skip consecutive duplicate points
   continue;
  }
  lastX=x;
  lastY=y;
  verts.push(x,y,0,0);
 }
 for(var index=0;index<verts.length;index+=4){
  prevVert=(index === 0) ? verts.length-4 : index-4;
  nextVert=(index===verts.length-4) ? 0 : index+4;
  verts[index+Triangulate._PREV]=prevVert;
  verts[index+Triangulate._NEXT]=nextVert;
 }
 for(index=0;index<verts.length;index+=4){
  var vertexClass=Triangulate._vertClass(verts,index,ori);
  if(vertexClass===Triangulate._EAR)
   ears.add(index);
  else if(vertexClass===Triangulate._REFLEX)
   reflex.add(index);
 }
 while(true){
  var earLength=ears.list(tmp);
  if(earLength<=0)break;
  for(i=0;i<earLength;i++){
   var ear=tmp[i];
   //console.log("processing "+[ear/4,prevVert/4,nextVert/4])
   prevVert=verts[ear+Triangulate._PREV];
   nextVert=verts[ear+Triangulate._NEXT];
   if(ear===prevVert || ear===nextVert || prevVert===nextVert){
    ears.remove(ear);
    continue;
   }
   // remove the ear from the linked list
   verts[prevVert+Triangulate._NEXT]=nextVert;
   verts[nextVert+Triangulate._PREV]=prevVert;
   tris.push([
    verts[prevVert],verts[prevVert+1],
    verts[ear],verts[ear+1],
    verts[nextVert],verts[nextVert+1]]);
   ears.remove(ear);
   // reclassify vertices
   var prevClass=Triangulate._vertClass(verts,prevVert,ori);
   var nextClass=Triangulate._vertClass(verts,nextVert,ori);
   if(prevClass!==Triangulate._REFLEX){
    reflex.remove(prevVert);
   } else {
    reflex.addIfMissing(prevVert);
   }
   if(prevClass!==Triangulate._EAR){
    ears.remove(prevVert);
   } else {
    ears.addIfMissing(prevVert);
   }
   if(nextClass!==Triangulate._REFLEX){
    reflex.remove(nextVert);
   } else {
    reflex.addIfMissing(nextVert);
   }
   if(nextClass!==Triangulate._EAR){
    ears.remove(nextVert);
   } else {
    ears.addIfMissing(nextVert);
   }
  }
 }
};
exports.GraphicsPath=GraphicsPath;
}));
