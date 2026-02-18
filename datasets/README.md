# 🧬 Crypto Genome: Database Architecture

Welcome to the data core of the **Crypto Genome Project**. This repository stores the "genetic" signatures of the cryptocurrency market, enabling deep analysis of asset behavior through multidimensional genomic profiling.

---

## 📊 Quick Overview
| Component | Purpose | Data Type |
| :--- | :--- | :--- |
| **Master Genome** | Central hub for all asset signatures | Aggregated CSV |
| **Dimensions** | Specific behavioral traits (Volatility, Liquidity, etc.) | Feature CSVs |
| **Canonical Data** | Cleaned, raw time-series for individual assets | Standardized CSVs |

---

## 📂 Folder Hierarchy & Purpose

```text
📂 datasets/
├── 🏆 crypto_genome_master.csv       # The "Final DNA" - Aggregated genomic features
├── 🧩 Crypt_Dimensions/              # The "Genes" - Behavioral specific dimensions
│   ├── 📈 genome_dim1_volatility.csv  # Risk & Variance metrics
│   ├── 🚀 genome_dim2_momentum.csv    # Velocity & Trend metrics
│   ├── 📉 genome_dim3_drawdown.csv    # Resilience & Recovery metrics
│   ├── 💧 genome_dim4_liquidity.csv   # Market Depth & Ease-of-Trade
│   └── 🔗 genome_dim5_dependence.csv  # Market Correlation & Tail-Risk
└── 🧪 standardized_datasets/          # The "Raw DNA" - Cleaned time-series per asset
    ├── BTC_Canonical.csv
    ├── ETH_Canonical.csv
    └── ... (90+ Assets)
```

---

## 🛠️ The 5 Genomic Dimensions

Each dimension represents a specific "trait" of a cryptocurrency's market personality:

### 1️⃣ **Volatility** (`dim1`)
- **Focus**: Price stability and uncertainty.
- **Why it matters**: Distinguishes "Stable" assets from "Speculative" ones.

### 2️⃣ **Momentum** (`dim2`)
- **Focus**: The strength and speed of price trends.
- **Why it matters**: Identifies assets with strong trend-following characteristics.

### 3️⃣ **Drawdown** (`dim3`)
- **Focus**: Pain points and crash recovery.
- **Why it matters**: Essential for calculating "Survival" scores during bear markets.

### 4️⃣ **Liquidity** (`dim4`)
- **Focus**: Trading volume and transaction efficiency.
- **Why it matters**: Filters out "Ghost" coins and identifies institutional-grade assets.

### 5️⃣ **Dependence** (`dim5`)
- **Focus**: Relation to the "Market King" (BTC) and broader indices.
- **Why it matters**: Reveals which assets move independently vs. those that just follow the crowd.

---

## 🧬 Standardized "Canonical" Datasets
The files in `standardized_datasets/` are the foundation of everything else.
- **Standardized Format**: Every file follows the same column structure (Date, Open, High, Low, Close, Volume).
- **Quality Control**: These have been pre-processed to handle missing values, outliers, and time-zone alignment.
- **Asset Coverage**: Includes major coins (BTC, ETH, SOL) and niche utility tokens.

---

## 🔄 Data Pipeline Flow
1. **Ingest**: Raw data is fetched for a new coin.
2. **Standardize**: Data is cleaned and saved to `standardized_datasets/` as `[SYMBOL]_Canonical.csv`.
3. **Extract**: Scripts analyze the Canonical file to calculate metrics for the **5 Dimensions**.
4. **Compile**: Dimensional data is merged into the `crypto_genome_master.csv`.

---

## 📝 Naming Conventions & Rules
> [!IMPORTANT]
> To maintain database integrity, always follow these rules:

- **Files**: Use `UPPERCASE_Canonical.csv` for standardized files.
- **Symbols**: Use standard exchange tickers (e.g., `LINK`, `AAVE`).
- **Dimensions**: Do not modify column names in `Crypt_Dimensions/` as they are hardcoded in the analysis scripts.

---

## 🚀 How to Use
- **For Clustering**: Load `crypto_genome_master.csv` into a Python/R environment to start K-Means or PCA analysis.
- **For Deep Dives**: If an asset shows an anomaly in the Master file, go back to its specific `Canonical.csv` to see the raw price action.

---
*Last Updated: February 2026*
