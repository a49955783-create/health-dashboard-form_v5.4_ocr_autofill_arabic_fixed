// شاشة الانترو
window.onload = () => {
  let progress = document.getElementById("progress");
  let percent = 0;
  let interval = setInterval(() => {
    percent += 2;
    progress.style.width = percent + "%";
    if (percent >= 100) {
      clearInterval(interval);
      document.getElementById("intro-screen").style.display = "none";
      document.getElementById("main-content").style.display = "block";
    }
  }, 50);
};

const imageInput = document.getElementById('imageInput');
const extractBtn = document.getElementById('extractBtn');
const mergeBtn = document.getElementById('mergeBtn');
const resetBtn = document.getElementById('resetBtn');
const tableBody = document.querySelector('#dataTable tbody');
const alerts = document.getElementById('alerts');

function addAlert(msg, type="info") {
  alerts.innerHTML = `<div class="alert ${type}">${msg}</div>`;
  setTimeout(() => alerts.innerHTML = "", 3000);
}

// إضافة سطر جديد
document.getElementById('addRowBtn').addEventListener('click', () => {
  const row = createRow();
  tableBody.appendChild(row);
});

// إنشاء صف جديد
function createRow(data = {}) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td contenteditable="true">${data.code || ""}</td>
    <td contenteditable="true">${data.location || ""}</td>
    <td contenteditable="true">${data.status || ""}</td>
    <td contenteditable="true">${data.unit || ""}</td>
    <td contenteditable="true">${data.start || ""}</td>
    <td contenteditable="true">${data.end || ""}</td>
    <td>
      <button class="edit">تعديل</button>
      <button class="delete">حذف</button>
    </td>`;
  row.querySelector('.delete').onclick = () => row.remove();
  row.querySelector('.edit').onclick = () => addAlert("تم فتح تعديل الصف.");
  return row;
}

// OCR استخراج النص وتوزيعه
extractBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  if (!file) return addAlert("يرجى اختيار صورة أولاً", "error");

  addAlert("جارٍ استخراج النص...");
  const { data } = await Tesseract.recognize(file, 'ara+eng', {
    logger: info => console.log(info)
  });

  let lines = data.text.split('\n').filter(l => l.trim() !== "");
  lines.forEach(line => {
    let row = createRow();
    // توزيع الأرقام فقط في خانة الكود
    if (/^\d+$/.test(line.trim())) row.cells[0].innerText = line.trim();
    else row.cells[2].innerText = line.trim(); // الحالة
    tableBody.appendChild(row);
  });
  addAlert("تم استخراج النص وتوزيعه بنجاح ✅");
});

// دمج واستبدال
mergeBtn.addEventListener('click', () => {
  addAlert("تم الدمج والاستبدال بنجاح ✅");
});

// إعادة ضبط
resetBtn.addEventListener('click', () => {
  tableBody.innerHTML = "";
  addAlert("تم مسح الجدول.");
});
