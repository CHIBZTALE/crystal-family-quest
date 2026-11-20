import numpy as np, math, random, os
from PIL import Image, ImageDraw, ImageFilter
W,H,GY=1280,720,585
OUT=os.path.join(os.path.dirname(__file__),'..','assets')
def hexc(h):
    h=h.lstrip('#')
    if len(h)==3: h=''.join(c*2 for c in h)
    return tuple(int(h[i:i+2],16) for i in (0,2,4))
def grad(top,bot,h=H):
    t=np.linspace(0,1,h)[:,None,None]; a=np.array(hexc(top))[None,None,:]; b=np.array(hexc(bot))[None,None,:]
    return Image.fromarray((a+(b-a)*t).repeat(W,1).astype('uint8'))
def ridge(img,base,amp,col,seed,freq=3,rough=.5):
    r=random.Random(seed); ph=[r.random()*6.28 for _ in range(5)]
    d=ImageDraw.Draw(img); pts=[(0,H)]
    for x in range(0,W+8,8):
        y=base
        for i in range(4): y+=amp*(rough**i)*math.sin(x/W*freq*(2**i)*6.28+ph[i])
        pts.append((x,y))
    pts.append((W,H)); d.polygon(pts,fill=col)
def glow(img,x,y,rad,col,a=.6):
    g=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(g)
    for i in range(12,0,-1):
        r=rad*i/12; d.ellipse((x-r,y-r,x+r,y+r),fill=col+(int(255*a*(1-i/12)**1.3+8),))
    img.alpha_composite(g)
def ground(img,top,bot,path,edge):
    d=ImageDraw.Draw(img)
    for y in range(GY-30,H):
        t=(y-(GY-30))/(H-GY+30); c=tuple(int(a+(b-a)*t) for a,b in zip(hexc(top),hexc(bot)))
        d.line((0,y,W,y),fill=c+(255,))
    d.rectangle((0,GY-34,W,GY-28),fill=hexc(edge)+(255,))
    # path strip
    for y in range(GY-6,H):
        t=(y-GY)/(H-GY); c=tuple(int(a*(1-t*.3)) for a in hexc(path))
        d.line((0,y,W,y),fill=c+(255,))
    d.rectangle((0,GY-8,W,GY-4),fill=hexc(edge)+(255,))
def blobs(img,n,ys,cols,sz,seed,shape='ell'):
    r=random.Random(seed); d=ImageDraw.Draw(img)
    for _ in range(n):
        x=r.randint(-40,W); y=r.randint(*ys); s=r.randint(*sz); c=hexc(r.choice(cols))+(255,)
        if shape=='ell': d.ellipse((x-s,y-s*.8,x+s,y+s*.8),fill=c)
        elif shape=='tri': d.polygon([(x,y-s*2),(x-s*.8,y+s),(x+s*.8,y+s)],fill=c)
        elif shape=='rect': d.rounded_rectangle((x-s*.25,y-s*2,x+s*.25,y+s),6,fill=c)
def sparkle(img,n,seed,col=(255,255,255),ys=(0,GY)):
    r=random.Random(seed); d=ImageDraw.Draw(img,'RGBA')
    for _ in range(n):
        x=r.randint(0,W); y=r.randint(*ys); s=r.randint(2,5)
        d.polygon([(x,y-s*2),(x+s*.5,y-s*.5),(x+s*2,y),(x+s*.5,y+s*.5),(x,y+s*2),(x-s*.5,y+s*.5),(x-s*2,y),(x-s*.5,y-s*.5)],fill=col+(200,))
def vignette(img,k=.35):
    yy,xx=np.mgrid[0:H,0:W]; d=np.sqrt(((xx-W/2)/(W/2))**2+((yy-H/2)/(H/2))**2)
    m=1-k*np.clip(d-.5,0,1.2); a=np.array(img.convert('RGB')).astype(float)*m[:,:,None]
    return Image.fromarray(a.clip(0,255).astype('uint8'))
def finish(img,name):
    img=img.filter(ImageFilter.GaussianBlur(.6)); img=vignette(img)
    img.save(os.path.join(OUT,'env_%s.jpg'%name),quality=86)
def new(top,bot):
    return grad(top,bot).convert('RGBA')

def caves():
    im=new('#1b1233','#4a2b7a'); 
    for s,c in ((1,'#2a1a52'),(2,'#201042')): ridge(im,330+s*40,40,hexc(c)+(255,),s,2)
    d=ImageDraw.Draw(im); r=random.Random(4)
    for _ in range(26):  # stalactites
        x=r.randint(0,W); l=r.randint(60,230); w=r.randint(18,46); d.polygon([(x-w,0),(x+w,0),(x,l)],fill=hexc('#150a2c')+(255,))
    for _ in range(14):  # crystals
        x=r.randint(0,W); y=r.randint(380,560); s=r.randint(20,50); c=hexc(r.choice(['#59d8ff','#d27bff','#ff7bd0']))
        glow(im,x,y,s*3,c,.5)
        d.polygon([(x,y-s*2),(x+s*.5,y),(x,y+s*.4),(x-s*.5,y)],fill=c+(255,))
    ground(im,'#3a2466','#25133f','#6c4aa8','#8a66d0'); sparkle(im,40,3,(200,230,255)); finish(im,'caves')
def sky():
    im=new('#4aa8ff','#cfeaff')
    glow(im,980,150,260,(255,244,200),.9)
    r=random.Random(5); d=ImageDraw.Draw(im)
    for _ in range(12):
        x=r.randint(-50,W); y=r.randint(60,400); s=r.randint(50,110)
        for dx,dy,k in ((0,0,1),(s*.7,10,.8),(-s*.7,12,.75),(s*.3,-s*.3,.7)): d.ellipse((x+dx-s*k,y+dy-s*k*.6,x+dx+s*k,y+dy+s*k*.6),fill=(255,255,255,235))
    ridge(im,500,30,hexc('#9fdcb0')+(255,),6,2)
    ground(im,'#f6f1ff','#d9cfff','#ffffff','#bfe8ff'); sparkle(im,30,6,(255,255,255)); finish(im,'sky')
def forest():
    im=new('#173d2a','#6fbf6a'); glow(im,700,60,400,(255,240,160),.55)
    ridge(im,380,40,hexc('#215a3a')+(255,),7)
    d=ImageDraw.Draw(im); r=random.Random(8)
    for layer,(col,sz) in enumerate((('#1c4a30',90),('#0f3320',130))):
        for i in range(10):
            x=i*140+r.randint(-30,30); h=r.randint(380,520)
            d.rounded_rectangle((x-18,GY-h,x+18,GY),8,fill=hexc('#3a2616')+(255,))
            for k in range(3): d.ellipse((x-sz+r.randint(-20,20),GY-h-sz*.7+k*30,x+sz,GY-h+sz*.6+k*30),fill=hexc(col)+(255,))
    for _ in range(40):  # sunbeams
        pass
    ground(im,'#2f7a3c','#1c4f2a','#8a6a3c','#58b85a'); blobs(im,30,(540,600),['#ff9ad0','#ffd36f','#fff'],(4,9),9)
    sparkle(im,40,8,(255,255,160),(100,500)); finish(im,'forest')
def festival():
    im=new('#2a0f4a','#d3418f'); d=ImageDraw.Draw(im); r=random.Random(9)
    for i in range(14):
        x=i*100+20; glow(im,x,260+(i%3)*40,90,hexc(['#ffd36f','#59e0ff','#ff6fb0'][i%3]),.5)
    ridge(im,430,25,hexc('#3d1a6a')+(255,),9,3)
    for i in range(0,W,70):  # bunting
        d.polygon([(i,80),(i+60,80),(i+30,150)],fill=hexc(['#ffd36f','#ff4f9a','#4fd6ff','#7fff9a'][(i//70)%4])+(255,))
    d.line((0,80,W,80),fill=(255,255,255,255),width=3)
    for x in (180,520,860,1140):  # tents
        d.polygon([(x-110,GY-20),(x,GY-190),(x+110,GY-20)],fill=hexc('#ff4f9a')+(255,)); d.polygon([(x-40,GY-20),(x,GY-100),(x+40,GY-20)],fill=hexc('#ffd36f')+(255,))
    ground(im,'#6a2a8a','#3a1458','#e8a64a','#ffd36f'); sparkle(im,70,9,(255,240,200),(40,500)); finish(im,'festival')
def savanna():
    im=new('#ff9b4a','#ffe3a0'); glow(im,640,430,340,(255,250,200),.9)
    d=ImageDraw.Draw(im); d.ellipse((560,350,720,510),fill=(255,244,190,255))
    ridge(im,470,30,hexc('#c9742f')+(255,),10,2); ridge(im,520,18,hexc('#a85a24')+(255,),11,3)
    for x in (200,900,1130):  # acacia
        d.rectangle((x-6,GY-150,x+6,GY-20),fill=hexc('#4a2c14')+(255,)); d.ellipse((x-110,GY-200,x+110,GY-140),fill=hexc('#2e5a2a')+(255,))
    ground(im,'#d08a3a','#a8642a','#e8b868','#e6a84a'); blobs(im,40,(560,600),['#e6c06a','#c99a4a'],(10,22),10,'tri')
    finish(im,'savanna')
def beach():
    im=new('#4ccfff','#bff3ff'); glow(im,200,130,300,(255,250,200),.8)
    d=ImageDraw.Draw(im)
    d.rectangle((0,360,W,GY-10),fill=hexc('#18a8d8')+(255,))
    for y in range(380,GY-10,22):
        for x in range(-40,W,90): d.arc((x,y,x+70,y+16),200,340,fill=(255,255,255,170),width=3)
    for x in (260,1060):  # palm
        d.line((x,GY,x+40,GY-250),fill=hexc('#7a5230')+(255,),width=18)
        for a in range(-2,3): d.polygon([(x+40,GY-250),(x+40+a*80,GY-270+abs(a)*30),(x+40+a*50,GY-220)],fill=hexc('#2fa860')+(255,))
    ground(im,'#f5dc9a','#d9b66a','#f8e8b0','#fff0c0'); blobs(im,16,(570,640),['#ff9ab0','#fff','#ffd36f'],(5,10),11)
    finish(im,'beach')
def snow():
    im=new('#7ec0ff','#eaf6ff'); glow(im,900,120,260,(255,255,255),.8)
    ridge(im,380,70,hexc('#cfe6ff')+(255,),12,2); ridge(im,450,40,hexc('#a9cdf0')+(255,),13,3)
    d=ImageDraw.Draw(im); r=random.Random(14)
    for _ in range(12):
        x=r.randint(0,W); s=r.randint(40,90); d.polygon([(x,GY-s*3),(x-s,GY-20),(x+s,GY-20)],fill=hexc('#2f6a58')+(255,)); d.polygon([(x,GY-s*3),(x-s*.4,GY-s*2),(x+s*.4,GY-s*2)],fill=(255,255,255,255))
    ground(im,'#ffffff','#cfe3f8','#e8f2ff','#ffffff'); sparkle(im,90,14,(255,255,255),(0,GY)); finish(im,'snow')
def ember():
    im=new('#3a0a0a','#ff6a1a'); glow(im,640,460,420,(255,190,60),.9)
    ridge(im,360,60,hexc('#2a0808')+(255,),15,2); ridge(im,450,30,hexc('#1a0505')+(255,),16,3)
    d=ImageDraw.Draw(im)
    for x in (200,640,1060): d.polygon([(x-160,GY),(x,GY-260),(x+160,GY)],fill=hexc('#3a1010')+(255,)); glow(im,x,GY-260,90,(255,120,30),.9)
    ground(im,'#5a2010','#2a0a06','#8a3a1a','#ff8a2a'); sparkle(im,70,15,(255,190,90),(100,GY)); finish(im,'ember')
def sweet():
    im=new('#ffb3e6','#fff0fa'); d=ImageDraw.Draw(im); r=random.Random(17)
    ridge(im,420,50,hexc('#ff9ad0')+(255,),17,2); ridge(im,480,30,hexc('#ffc2e6')+(255,),18,3)
    for i in range(9):
        x=i*150+40; h=r.randint(180,320); c=hexc(r.choice(['#ff4f9a','#59d8ff','#ffd36f','#9a7bff']))
        d.rectangle((x-8,GY-h,x+8,GY-20),fill=(255,255,255,255)); d.ellipse((x-60,GY-h-60,x+60,GY-h+60),fill=c+(255,))
        for k in range(3): d.arc((x-60+k*18,GY-h-60+k*18,x+60-k*18,GY-h+60-k*18),0,360,fill=(255,255,255,200),width=5)
    ground(im,'#ffd9ec','#ffa8d6','#fff0f8','#ffffff'); blobs(im,30,(560,640),['#ff4f9a','#59d8ff','#ffd36f'],(6,12),18)
    sparkle(im,50,17,(255,255,255)); finish(im,'sweet')
for f in (caves,sky,forest,festival,savanna,beach,snow,ember,sweet): f(); print(f.__name__)
