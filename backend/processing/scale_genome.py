import pandas as pd

filepath = "../../datasets/crypto_genome_master.csv"

# Load dataset
df = pd.read_csv(filepath)

print("\n--- BASIC INFO ---")
print(df.shape)
print(df.columns.tolist())

print("\n--- DATA TYPES ---")
print(df.dtypes)

print("\n--- NULL CHECK ---")
print(df.isnull().sum())

print("\n--- SAMPLE ---")
print(df.head())