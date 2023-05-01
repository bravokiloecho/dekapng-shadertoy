precision highp float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iChannel0;

uniform vec2 iDekaPngOffset;
uniform float iSampleRate;

#define PI 3.14159365
#define TAU 6.28318531

#pragma glslify:checker=require('glsl-checker')

void mainImage(out vec4 fragColor,in vec2 fragCoord)
{
  vec2 uv=fragCoord.xy/iResolution.xy;
  
  //optionally fix aspect ratio
  // uv.x*=iResolution.x/iResolution.y;
  
  // checkered background
  float totalSquares=4.;
  float gray=mix(.8,1.,checker(uv,totalSquares));
  vec3 col=vec3(gray);
  
  col+=uv.y*.15;
  
  vec3 blue=vec3(0.,0.,1.);
  col=mix(col,blue,uv.x);
  
  fragColor=vec4(col,1.);
}

void main(){
  mainImage(gl_FragColor,gl_FragCoord.xy+iDekaPngOffset);
}