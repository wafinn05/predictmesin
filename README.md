# 🏭 AI4I 2020 Predictive Maintenance Dataset

> Dataset untuk deteksi kegagalan mesin berbasis Machine Learning — cocok untuk klasifikasi biner maupun multi-label.

---

## 📋 Deskripsi Dataset

**AI4I 2020 Predictive Maintenance Dataset** adalah dataset sintetis yang mencerminkan kondisi nyata dari sebuah mesin manufaktur. Dataset ini dirancang khusus untuk keperluan **Predictive Maintenance (PdM)** menggunakan pendekatan Machine Learning, di mana tujuannya adalah memprediksi kegagalan mesin sebelum terjadi berdasarkan data sensor real-time.

Dataset ini bersumber dari **UCI Machine Learning Repository** dan banyak digunakan sebagai benchmark dalam penelitian bidang industrial AI.

---

## 📁 Informasi File

| Atribut | Nilai |
|---|---|
| **Nama File** | `ai4i2020.csv` |
| **Ukuran File** | ±522 KB |
| **Jumlah Baris** | 10.000 (tidak termasuk header) |
| **Jumlah Kolom** | 14 |
| **Format** | CSV (Comma-Separated Values) |
| **Missing Values** | Tidak ada |

---

## 🗂️ Struktur Kolom

### 🔑 Kolom Identifikasi

| Kolom | Tipe Data | Deskripsi |
|---|---|---|
| `UDI` | Integer | Unique Device Identifier — ID unik berurutan (1–10.000) |
| `Product ID` | String | Kode produk yang terdiri dari huruf kelas kualitas (L/M/H) diikuti nomor seri |
| `Type` | Categorical | Kelas kualitas mesin: **L** (Low), **M** (Medium), **H** (High) |

### 🌡️ Kolom Fitur Sensor (Input/Features)

| Kolom | Satuan | Deskripsi | Min | Max | Mean |
|---|---|---|---|---|---|
| `Air temperature [K]` | Kelvin | Suhu udara di sekitar mesin | 295.3 | 304.5 | 300.00 |
| `Process temperature [K]` | Kelvin | Suhu proses mesin (selalu lebih tinggi dari suhu udara) | 305.7 | 313.8 | 310.01 |
| `Rotational speed [rpm]` | RPM | Kecepatan rotasi mesin | 1168 | 2886 | 1538.78 |
| `Torque [Nm]` | Newton-meter | Torsi yang dihasilkan mesin | 3.8 | 76.6 | 39.99 |
| `Tool wear [min]` | Menit | Waktu pemakaian alat/tool secara kumulatif | 0 | 253 | 107.95 |

### 🎯 Kolom Target (Output/Labels)

| Kolom | Tipe Data | Deskripsi |
|---|---|---|
| `Machine failure` | Binary (0/1) | Label utama — **1** jika terjadi kegagalan, **0** jika normal |
| `TWF` | Binary (0/1) | **Tool Wear Failure** — Kegagalan akibat keausan alat yang berlebih |
| `HDF` | Binary (0/1) | **Heat Dissipation Failure** — Kegagalan akibat disipasi panas yang tidak memadai |
| `PWF` | Binary (0/1) | **Power Failure** — Kegagalan akibat daya yang tidak sesuai |
| `OSF` | Binary (0/1) | **Overstrain Failure** — Kegagalan akibat beban berlebih pada mesin |
| `RNF` | Binary (0/1) | **Random Failure** — Kegagalan acak yang tidak terkait parameter lain |

> ⚠️ **Catatan:** Kolom `Machine failure` bernilai **1** jika setidaknya **satu** dari 5 mode kegagalan di atas aktif.

---

## 📊 Statistik Dataset

### Distribusi Tipe Mesin

| Tipe | Jumlah | Persentase |
|---|---|---|
| **L** (Low Quality) | 6.000 | 60.00% |
| **M** (Medium Quality) | 2.997 | 29.97% |
| **H** (High Quality) | 1.003 | 10.03% |

### Distribusi Label Kegagalan

| Label | Jumlah Kasus | Persentase |
|---|---|---|
| **Normal (Tidak Gagal)** | 9.661 | 96.61% |
| **Machine failure = 1** | 339 | **3.39%** |

### Distribusi Mode Kegagalan

| Mode Kegagalan | Singkatan | Jumlah | % dari Total |
|---|---|---|---|
| Heat Dissipation Failure | HDF | 115 | 1.15% |
| Overstrain Failure | OSF | 98 | 0.98% |
| Power Failure | PWF | 95 | 0.95% |
| Tool Wear Failure | TWF | 46 | 0.46% |
| Random Failure | RNF | 19 | 0.19% |

> 📌 **Catatan:** Dataset ini termasuk **imbalanced** (tidak seimbang). Kelas kegagalan hanya ~3.39% dari total data. Perlu penanganan khusus seperti **SMOTE**, **oversampling**, atau **class weighting** saat melatih model.

---

## 🤖 Rekomendasi Penggunaan untuk Machine Learning

### Task yang Bisa Dilakukan

| Task | Deskripsi |
|---|---|
| **Binary Classification** | Prediksi apakah mesin akan gagal atau tidak (`Machine failure`) |
| **Multi-label Classification** | Prediksi jenis kegagalan mana yang akan terjadi (TWF, HDF, PWF, OSF, RNF) |
| **Anomaly Detection** | Deteksi anomali dari data sensor secara unsupervised |
| **Regression** | Prediksi nilai torsi atau kecepatan sebagai sub-task |

### Rekomendasi Model

- **Klasifikasi:** Random Forest, XGBoost, LightGBM, SVM, Neural Network
- **Deteksi Anomali:** Isolation Forest, Autoencoder
- **Fitur Engineering:** Selisih suhu (`Process temp - Air temp`), Power = `Torque × RPM`

### Preprocessing yang Disarankan

```python
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

df = pd.read_csv('ai4i2020.csv')

# Encode kolom kategorikal
le = LabelEncoder()
df['Type'] = le.fit_transform(df['Type'])  # L=1, M=2, H=0

# Drop kolom ID yang tidak relevan untuk training
df_features = df.drop(columns=['UDI', 'Product ID'])

# Fitur input (X) dan target (y)
X = df_features[['Type', 'Air temperature [K]', 'Process temperature [K]',
                  'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']]
y = df_features['Machine failure']

# Normalisasi fitur numerik
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

### Menangani Ketidakseimbangan Kelas

```python
from imblearn.over_sampling import SMOTE

sm = SMOTE(random_state=42)
X_resampled, y_resampled = sm.fit_resample(X_scaled, y)
```

---

## 🔬 Aturan Kegagalan (Domain Knowledge)

Dataset ini mengikuti aturan kegagalan yang jelas berdasarkan domain industri:

| Kondisi Kegagalan | Penjelasan |
|---|---|
| **Tool Wear Failure (TWF)** | Tool wear > 200 min pada kecepatan dan torsi tertentu |
| **Heat Dissipation Failure (HDF)** | Selisih suhu proses dan udara < 8.6 K saat kecepatan < 1380 rpm |
| **Power Failure (PWF)** | Power (Torque × RPM) < 3500 W atau > 9000 W |
| **Overstrain Failure (OSF)** | Tool wear × Torque melebihi batas berdasarkan tipe mesin |
| **Random Failure (RNF)** | Probabilitas 0.1% untuk semua produk |

---

## 📚 Referensi & Sumber

- **Sumber Dataset:** [UCI Machine Learning Repository – AI4I 2020](https://archive.ics.uci.edu/ml/datasets/AI4I+2020+Predictive+Maintenance+Dataset)
- **Paper Referensi:** S. Matzka, "Explainable Artificial Intelligence for Predictive Maintenance Applications," *2020 Third International Conference on Artificial Intelligence for Industries*, 2020.
- **DOI:** 10.24432/C5HS5C

---

## 📝 Catatan Tambahan

- Dataset ini bersifat **sintetis** (dibuat secara artifisial) namun mencerminkan distribusi statistik yang realistis dari lingkungan manufaktur nyata.
- Kolom `Product ID` mengandung prefix tipe mesin: `L` untuk Low, `M` untuk Medium, `H` untuk High.
- Kolom `Tool wear [min]` di-reset ke 0 setiap kali tool diganti (dapat dilihat dari pola data).

---

*README dibuat untuk keperluan proyek Machine Learning Predictive Maintenance.*
