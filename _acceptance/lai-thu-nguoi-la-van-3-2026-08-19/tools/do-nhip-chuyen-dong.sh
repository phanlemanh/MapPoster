#!/usr/bin/env bash
# do-nhip-chuyen-dong.sh — đo NHỊP chuyển động của một clip bằng số.
#
#   bash do-nhip-chuyen-dong.sh <clip.mp4>
#
# Vì sao: câu (c) hỏi "có giật không" là câu THỊ GIÁC, và mọi khẳng định thị giác
# trong ván phải có một phép đo máy đứng cạnh.
#
# Cách đo: hạ mỗi khung xuống 96×170 mức xám, đọc thẳng byte thô, rồi tính SAI
# KHÁC TUYỆT ĐỐI TRUNG BÌNH (MAD) giữa hai khung liên tiếp. Dãy MAD là nhịp:
#   - pha nghỉ (`restAtSec` sản phẩm tự khai) hiện ra thành đuôi MAD ≈ 0;
#   - chuyển động ĐỀU cho dãy trơn;
#   - giật cho dãy nhấp nhô, và hệ số biến thiên (độ lệch chuẩn / trung bình)
#     của riêng phần ĐANG CHUYỂN ĐỘNG lớn hơn hẳn.
# Không dùng bộ lọc `scene` của ffmpeg vì nó chỉ sinh metadata khi biểu thức
# select thật sự gọi `scene`, và giá trị đó đã lượng tử hoá — byte thô thì không.

set -u
CLIP="${1:?cần clip.mp4}"
W=96; H=170

ffmpeg -v error -i "$CLIP" -vf "scale=$W:$H,format=gray" -f rawvideo - 2>/dev/null \
| node -e '
const W=Number(process.argv[1]), H=Number(process.argv[2]), N=W*H;
const bufs=[]; process.stdin.on("data",c=>bufs.push(c));
process.stdin.on("end",()=>{
  const all=Buffer.concat(bufs);
  const nf=Math.floor(all.length/N);
  const mad=[];
  for(let f=1; f<nf; f++){
    let s=0;
    const a=f*N, b=(f-1)*N;
    for(let i=0;i<N;i++) s+=Math.abs(all[a+i]-all[b+i]);
    mad.push(s/N);
  }
  const fps=18, at=i=>((i+2)/fps).toFixed(2);
  const max=Math.max(...mad), thr=max*0.02;
  const moving=mad.filter(v=>v>thr);
  let last=0; for(let i=mad.length-1;i>=0;i--) if(mad[i]>thr){ last=i; break; }
  const mean=moving.reduce((a,b)=>a+b,0)/moving.length;
  const sd=Math.sqrt(moving.reduce((a,b)=>a+(b-mean)**2,0)/moving.length);
  console.log("số khung                :", nf);
  console.log("MAD lớn nhất            :", max.toFixed(3));
  console.log("khung cuối còn chuyển động:", at(last), "s  => pha nghỉ dài", (nf/fps-Number(at(last))).toFixed(2), "s");
  console.log("MAD trung bình (phần động):", mean.toFixed(3));
  console.log("độ lệch chuẩn             :", sd.toFixed(3));
  console.log("HỆ SỐ BIẾN THIÊN sd/mean  :", (sd/mean).toFixed(3), " <-- càng lớn càng không đều");
  console.log("\ndãy MAD (mỗi dòng 9 khung = 0,5 s):");
  for(let i=0;i<mad.length;i+=9)
    console.log(" t=" + at(i).padStart(5) + "s  " + mad.slice(i,i+9).map(x=>x.toFixed(2).padStart(6)).join(" "));
});
' "$W" "$H"
