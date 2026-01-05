import React, { useState } from 'react';
import axios from 'axios';
import { Parser } from 'json2csv';
function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    setLoading(true);
    setData([]); // Yeni yüklemede eskiyi temizle
    try {
      // Buradaki URL'yi Backend'i Render'a yükledikten sonra alacağımız URL ile değiştireceğiz.
const API_URL = process.env.REACT_APP_API_URL || 'https://pdftocsv-r9zm.onrender.com';
const res = await axios.post(`${API_URL}/upload`, formData);
      // Backend'den gelen verinin array olduğundan emin olalım
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        alert("Yapay zeka veriyi beklenen formatta döndüremedi.");
      }
    } catch (err) {
      console.error(err);
      alert("İşlem sırasında hata: " + (err.response?.data || err.message));
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    try {
      // Senin istediğin kolon sırası
      const fields = [
        'exam_name', 'question_html', 'model_choice', 'subject', 
        'label', 'order', 'choice_A_html', 'choice_B_html', 
        'choice_C_html', 'choice_D_html'
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      // Excel'in Türkçe karakterleri tanıması için BOM ekliyoruz
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SAT_Export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("CSV oluşturulurken hata: " + err.message);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, Arial', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Digital SAT PDF to CSV (Gemini 2.0 Flash)</h1>
        <p>PDF yükleyin ve AI tüm soruları CSV formatına dönüştürsün.</p>
        
        <input 
          type="file" 
          onChange={handleFileUpload} 
          accept="application/pdf"
          style={{ marginBottom: '20px' }}
        />
        
        {loading && (
          <div style={{ color: '#007bff', fontWeight: 'bold' }}>
            🔄 Sorular analiz ediliyor (bu işlem 30-60 saniye sürebilir)...
          </div>
        )}

        {data.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={downloadCSV} 
              style={{ padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
            >
              📥 {data.length} Soruyu CSV Olarak İndir
            </button>
            
            <div style={{ overflowX: 'auto', marginTop: '20px' }}>
              <table border="1" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                <thead style={{ backgroundColor: '#e9ecef' }}>
                  <tr>
                    <th style={{ padding: '10px' }}>Soru (HTML)</th>
                    <th style={{ padding: '10px' }}>A Şıkkı</th>
                    <th style={{ padding: '10px' }}>Cevap</th>
                    <th style={{ padding: '10px' }}>Zorluk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: item.question_html }}></td>
                      <td style={{ padding: '10px', fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: item.choice_A_html }}></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><b>{item.model_choice}</b></td>
                      <td style={{ padding: '10px' }}>{item.order}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
