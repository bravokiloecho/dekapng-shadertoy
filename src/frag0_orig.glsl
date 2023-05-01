precision highp float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

// Protean clouds by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/3l23Rh
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

/*
Technical details:

The main volume noise is generated from a deformed periodic grid, which can produce
a large range of noise-like patterns at very cheap evalutation cost. Allowing for multiple
fetches of volume gradient computation for improved lighting.

To further accelerate marching, since the volume is smooth, more than half the density
information isn't used to rendering or shading but only as an underlying volume	distance to
determine dynamic step size, by carefully selecting an equation	(polynomial for speed) to
step as a function of overall density (not necessarialy rendered) the visual results can be
the	same as a naive implementation with ~40% increase in rendering performance.

Since the dynamic marching step size is even less uniform due to steps not being rendered at all
the fog is evaluated as the difference of the fog integral at each rendered step.

*/

mat2 rot(in float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
const mat3 m3=mat3(.33338,.56034,-.71817,-.87887,.32651,-.15323,.15162,.69596,.61339)*1.93;
float mag2(vec2 p){return dot(p,p);}
float linstep(in float mn,in float mx,in float x){return clamp((x-mn)/(mx-mn),0.,1.);}
float prm1=0.;
vec2 bsMo=vec2(0);

vec2 disp(float t){return vec2(sin(t*.22)*1.,cos(t*.175)*1.)*2.;}

vec2 map(vec3 p)
{
  vec3 p2=p;
  p2.xy-=disp(p.z).xy;
  p.xy*=rot(sin(p.z+iTime)*(.1+prm1*.05)+iTime*.09);
  float cl=mag2(p2.xy);
  float d=0.;
  p*=.61;
  float z=1.;
  float trk=1.;
  float dspAmp=.1+prm1*.2;
  for(int i=0;i<5;i++)
  {
    p+=sin(p.zxy*.75*trk+iTime*trk*.8)*dspAmp;
    d-=abs(dot(cos(p),sin(p.yzx))*z);
    z*=.57;
    trk*=1.4;
    p=p*m3;
  }
  d=abs(d+prm1*3.)+prm1*.3-2.5+bsMo.y;
  return vec2(d+cl*.2+.25,cl);
}

vec4 render(in vec3 ro,in vec3 rd,float time)
{
  vec4 rez=vec4(0);
  const float ldst=8.;
  vec3 lpos=vec3(disp(time+ldst)*.5,time+ldst);
  float t=1.5;
  float fogT=0.;
  for(int i=0;i<130;i++)
  {
    if(rez.a>.99)break;
    
    vec3 pos=ro+t*rd;
    vec2 mpv=map(pos);
    float den=clamp(mpv.x-.3,0.,1.)*1.12;
    float dn=clamp((mpv.x+2.),0.,3.);
    
    vec4 col=vec4(0);
    if(mpv.x>.6)
    {
      
      col=vec4(sin(vec3(5.,.4,.2)+mpv.y*.1+sin(pos.z*.4)*.5+1.8)*.5+.5,.08);
      col*=den*den*den;
      col.rgb*=linstep(4.,-2.5,mpv.x)*2.3;
      float dif=clamp((den-map(pos+.8).x)/9.,.001,1.);
      dif+=clamp((den-map(pos+.35).x)/2.5,.001,1.);
      col.xyz*=den*(vec3(.005,.045,.075)+1.5*vec3(.033,.07,.03)*dif);
    }
    
    float fogC=exp(t*.2-2.2);
    col.rgba+=vec4(.06,.11,.11,.1)*clamp(fogC-fogT,0.,1.);
    fogT=fogC;
    rez=rez+col*(1.-rez.a);
    t+=clamp(.5-dn*dn*.05,.09,.3);
  }
  return clamp(rez,0.,1.);
}

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

void mainImage(out vec4 fragColor,in vec2 fragCoord)
{
  vec2 q=fragCoord.xy/iResolution.xy;
  vec2 p=(gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
  bsMo=(iMouse.xy-.5*iResolution.xy)/iResolution.y;
  
  float time=iTime*3.;
  vec3 ro=vec3(0,0,time);
  
  ro+=vec3(sin(iTime)*.5,sin(iTime*1.)*0.,0);
  
  float dspAmp=.85;
  ro.xy+=disp(ro.z)*dspAmp;
  float tgtDst=3.5;
  
  vec3 target=normalize(ro-vec3(disp(time+tgtDst)*dspAmp,time+tgtDst));
  ro.x-=bsMo.x*2.;
  vec3 rightdir=normalize(cross(target,vec3(0,1,0)));
  vec3 updir=normalize(cross(rightdir,target));
  rightdir=normalize(cross(updir,target));
  vec3 rd=normalize((p.x*rightdir+p.y*updir)*1.-target);
  rd.xy*=rot(-disp(time+3.5).x*.2+bsMo.x);
  prm1=smoothstep(-.4,.4,sin(iTime*.3));
  vec4 scn=render(ro,rd,time);
  
  vec3 col=scn.rgb;
  col=iLerp(col.bgr,col.rgb,clamp(1.-prm1,.05,1.));
  
  col=pow(col,vec3(.55,.65,.6))*vec3(1.,.97,.9);
  
  col*=pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y),.12)*.7+.3;//Vign
  
  fragColor=vec4(col,1.);
}

void main(){
  mainImage(gl_FragColor,gl_FragCoord.xy);
}