// Form Submit Handler
document.getElementById('contractForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Form verilerini topla
  const formData = {
    companyName: document.getElementById('companyName').value,
    clientName: document.getElementById('clientName').value,
    jobDuration: document.getElementById('jobDuration').value,
    startDate: document.getElementById('startDate').value,
    advance: document.getElementById('advance').value || 0,
    deposit: document.getElementById('deposit').value || 0,
    salary: document.getElementById('salary').value,
    jobDescription: document.getElementById('jobDescription').value
  };

  // Loading göster
  showStage2WithLoading();

  try {
    // API'ye gönder
    const response = await fetch('/api/create-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      // Sözleşmeyi göster
      displayContract(result.contractText, result.pdfFilename);
    } else {
      showError(result.error || 'Bir hata oluştu');
      goBackToForm();
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Sunucu ile iletişim kurulamadı: ' + error.message);
    goBackToForm();
  }
});

// Aşama 2'yi loading göstererek aç
function showStage2WithLoading() {
  document.getElementById('stage1').classList.remove('active');
  document.getElementById('stage2').classList.add('active');
  document.getElementById('loadingSpinner').style.display = 'flex';
  document.getElementById('contractPreview').innerHTML = '';
  document.getElementById('downloadBtn').style.display = 'none';

  // Progress bar güncellemeleri
  document.getElementById('step1').classList.remove('active');
  document.getElementById('step2').classList.add('active');
}

// Sözleşmeyi göster
function displayContract(contractText, pdfFilename) {
  document.getElementById('loadingSpinner').style.display = 'none';
  document.getElementById('contractPreview').textContent = contractText;
  document.getElementById('downloadBtn').style.display = 'inline-block';

  // Download butonuna dosya adını ata
  document.getElementById('downloadBtn').onclick = () => downloadPDF(pdfFilename);
}

// PDF indir
async function downloadPDF(filename) {
  try {
    const response = await fetch('/api/download-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      showError('PDF indirilemedi');
    }
  } catch (error) {
    console.error('Download Error:', error);
    showError('İndirme hatası: ' + error.message);
  }
}

// Geri dön
function goBackToForm() {
  document.getElementById('stage2').classList.remove('active');
  document.getElementById('stage1').classList.add('active');

  document.getElementById('step2').classList.remove('active');
  document.getElementById('step1').classList.add('active');

  document.getElementById('contractForm').reset();
}

// Hata göster
function showError(message) {
  alert('❌ Hata: ' + message);
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
  console.log('İş Sözleşmesi Oluşturucu Hazır ✓');
});
