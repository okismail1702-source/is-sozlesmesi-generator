const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// OpenAI API ile sözleşme oluştur
const generateContractWithAI = async (formData) => {
  try {
    const prompt = `
    Aşağıdaki bilgilere göre profesyonel bir Türkçe İş Sözleşmesi yazın:
    
    Şirket Adı: ${formData.companyName}
    Müşteri/İşçi Adı: ${formData.clientName}
    İş Süresi: ${formData.jobDuration}
    Peşinat: ${formData.advance}
    Kapora: ${formData.deposit}
    İş Tanımı: ${formData.jobDescription}
    Ücret: ${formData.salary}
    Başlangıç Tarihi: ${formData.startDate}
    
    Sözleşmede profesyonel, yasal uygun ve Türkçe olmalıdır.
    `;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen bir hukuk danışmanısın ve profesyonel iş sözleşmeleri yazıyorsun.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI Hatası:', error);
    throw new Error('Sözleşme oluşturulurken hata oluştu');
  }
};

// PDF Oluştur
const createPDF = (contractText, formData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filename = `sozlesme_${formData.companyName}_${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../pdfs', filename);

      // Klasörü oluştur
      if (!fs.existsSync(path.join(__dirname, '../pdfs'))) {
        fs.mkdirSync(path.join(__dirname, '../pdfs'), { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Başlık
      doc.fontSize(16).font('Helvetica-Bold').text('İŞ SÖZLEŞMESİ', { align: 'center' });
      doc.moveDown();

      // Tarih
      doc.fontSize(10).font('Helvetica').text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, { align: 'right' });
      doc.moveDown();

      // Ana metin
      doc.fontSize(11).text(contractText);

      doc.end();

      stream.on('finish', () => {
        resolve({ filename, filepath });
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Controller
exports.createContract = async (req, res) => {
  try {
    const formData = req.body;

    // Validasyon
    if (!formData.companyName || !formData.clientName) {
      return res.status(400).json({ error: 'Şirket adı ve müşteri adı gereklidir' });
    }

    // AI ile sözleşme oluştur
    const contractText = await generateContractWithAI(formData);

    // PDF oluştur
    const pdfInfo = await createPDF(contractText, formData);

    res.json({
      success: true,
      contractText,
      pdfFilename: pdfInfo.filename,
      message: 'Sözleşme başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const { filename } = req.body;
    const filepath = path.join(__dirname, '../pdfs', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
