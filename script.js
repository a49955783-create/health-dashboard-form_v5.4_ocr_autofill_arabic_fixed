document.getElementById("imageUpload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const imageData = reader.result;

    const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
      tessedit_char_whitelist: '0123456789',
    });

    // استخراج الأرقام فقط من النص
    const codes = text.match(/\d+/g) || [];
    const mode = document.querySelector('input[name="ocrMode"]:checked').value;
    const tbody = document.getElementById("dataBody");

    if (mode === "replace") tbody.innerHTML = ""; // استبدال كامل

    codes.forEach(code => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td contenteditable="true">${code}</td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td><button class="edit-btn">✏️</button></td>
        <td><button class="add-btn">➕</button></td>
        <td><button class="delete-btn">❌</button></td>
      `;
      tbody.appendChild(row);
    });

    alert("✅ تم توزيع الأكواد تلقائيًا على القائمة!");
  };

  reader.readAsDataURL(file);
});

// أزرار التعديل والإضافة والحذف
document.getElementById("dataBody").addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    e.target.closest("tr").remove();
  } else if (e.target.classList.contains("add-btn")) {
    const newRow = e.target.closest("tr").cloneNode(true);
    newRow.querySelectorAll("td[contenteditable='true']").forEach(td => td.textContent = "");
    e.target.closest("tbody").appendChild(newRow);
  }
});
