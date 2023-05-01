precision highp float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iChannel0;

uniform vec2 iDekaPngOffset;
uniform float iSampleRate;

#define PI 3.14159365
#define TAU 6.28318531

float getsat(vec3 c)
{
  float mi=min(min(c.x,c.y),c.z);
  float ma=max(max(c.x,c.y),c.z);
  return(ma-mi)/(ma+1e-7);
}

//from my "Will it blend" shader (https://www.shadertoy.com/view/lsdGzN)
vec3 iLerp(in vec3 a,in vec3 b,in float x)
{
  vec3 ic=mix(a,b,x)+vec3(1e-6,0.,0.);
  float sd=abs(getsat(ic)-mix(getsat(a),getsat(b),x));
  vec3 dir=normalize(vec3(2.*ic.x-ic.y-ic.z,2.*ic.y-ic.x-ic.z,2.*ic.z-ic.y-ic.x));
  float lgt=dot(vec3(1.),ic);
  float ff=dot(dir,normalize(ic));
  ic+=1.5*dir*sd*ff*lgt;
  return clamp(ic,0.,1.);
}

//cheaply lerp around a circle
float lerpAng(in float a,in float b,in float x)
{
  float ang=mod(mod((a-b),TAU)+PI*3.,TAU)-PI;
  return ang*x+b;
}

//Linear interpolation between two colors in Lch space
vec3 lerpLch(in vec3 a,in vec3 b,in float x)
{
  float hue=lerpAng(a.z,b.z,x);
  return vec3(mix(b.xy,a.xy,x),hue);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord)
{
  vec2 uv=fragCoord.xy/iResolution.xy;
  
  // vec3 red=vec3(1.,0.,0.);
  // vec3 green=vec3(.949,1.,0.);
  // float offset=sin(iTime*.1)*.01;
  // vec3 col=iLerp(red,green,q.y+offset);
  
  vec3 col=texture2D(iChannel0,uv).rgb;
  
  fragColor=vec4(col,1.);
}

void main(){
  mainImage(gl_FragColor,gl_FragCoord.xy+iDekaPngOffset);
}