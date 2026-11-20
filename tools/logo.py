import os, base64
os.environ['PLAYWRIGHT_BROWSERS_PATH']=os.environ.get('PLAYWRIGHT_BROWSERS_PATH','/opt/pw-browsers')
from playwright.sync_api import sync_playwright
A='/home/claude/game/assets/'; R='/home/claude/game/resources/'
def b64(n): return 'data:image/png;base64,'+base64.b64encode(open(A+n,'rb').read()).decode()
gem=b64('gem_blue.png')
FONT="font-family:'Poppins',sans-serif;font-weight:800;"
LOGO=f"""<html><body style="margin:0;background:transparent"><div id=l style="width:1200px;height:520px;position:relative;{FONT}">
<img src="{gem}" style="position:absolute;left:30px;top:60px;width:150px;filter:drop-shadow(0 0 24px #59d8ff)">
<img src="{gem}" style="position:absolute;right:30px;top:60px;width:150px;filter:hue-rotate(260deg) drop-shadow(0 0 24px #d27bff)">
<div style="position:absolute;top:30px;width:100%;text-align:center;font-size:150px;line-height:1;letter-spacing:2px;
 background:linear-gradient(#fff6c8,#ffd36f 45%,#ff9a2e);-webkit-background-clip:text;color:transparent;
 -webkit-text-stroke:14px #5a2478;paint-order:stroke fill;filter:drop-shadow(0 10px 0 #2a0f45) drop-shadow(0 0 30px #ff9be0)">Crystal</div>
<div style="position:absolute;top:200px;width:100%;text-align:center;font-size:150px;line-height:1;
 background:linear-gradient(#e8ffff,#59d8ff 50%,#2f7bff);-webkit-background-clip:text;color:transparent;
 -webkit-text-stroke:14px #5a2478;paint-order:stroke fill;filter:drop-shadow(0 10px 0 #2a0f45)">Family Quest</div>
<div style="position:absolute;top:410px;width:100%;text-align:center;font-size:40px;color:#fff;letter-spacing:8px;text-shadow:0 3px 0 #5a2478;font-weight:700">AN IGBO-INSPIRED ADVENTURE</div>
</div></body></html>"""
def icon(fg_only=False):
    dad,mom,son,dau=[b64(n) for n in ('por_dad_active.png','por_mom.png','por_son.png','por_daughter.png')]
    bg='' if fg_only else 'background:radial-gradient(circle at 50% 30%,#a05bff,#5a2478 60%,#2a0f45);'
    s='' if fg_only else ''
    return f"""<html><body style="margin:0"><div id=i style="width:1024px;height:1024px;position:relative;overflow:hidden;{bg}">
<div style="position:absolute;inset:0;{'' if fg_only else 'background:radial-gradient(circle at 50% 38%,rgba(255,220,120,.55),transparent 55%)'}"></div>
<img src="{gem}" style="position:absolute;left:337px;top:150px;width:350px;filter:drop-shadow(0 0 40px #59d8ff)">
<div style="position:absolute;left:160px;top:520px;width:704px;display:flex;justify-content:space-between">
 <img src="{dad}" style="width:150px;height:150px;border-radius:50%"><img src="{mom}" style="width:150px;height:150px;border-radius:50%"><img src="{son}" style="width:150px;height:150px;border-radius:50%"><img src="{dau}" style="width:150px;height:150px;border-radius:50%"></div>
<div style="position:absolute;top:720px;width:100%;text-align:center;{FONT}font-size:130px;background:linear-gradient(#fff6c8,#ff9a2e);-webkit-background-clip:text;color:transparent;-webkit-text-stroke:12px #2a0f45;paint-order:stroke fill">CFQ</div>
</div></body></html>"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox']); pg=b.new_page(viewport={'width':1300,'height':1100})
    pg.set_content(LOGO); pg.wait_for_timeout(500); pg.locator('#l').screenshot(path=A+'logo.png',omit_background=True)
    for name,fg in (('icon',False),('icon-foreground',True)):
        pg.set_content(icon(fg)); pg.wait_for_timeout(500)
        pg.locator('#i').screenshot(path=R+name+'.png',omit_background=fg)
    pg.set_content('<body style="margin:0;background:#5a2478"><div id=i style="width:1024px;height:1024px;background:radial-gradient(circle at 50% 30%,#a05bff,#5a2478 60%,#2a0f45)"></div>'); pg.locator('#i').screenshot(path=R+'icon-background.png')
    b.close()
from PIL import Image
l=Image.open(A+'logo.png'); print(l.size)
# splash
sp=Image.open(A+'title.jpg').convert('RGB').resize((2732,2732*720//1280)); 
sp.save(R+'splash-src.jpg')
