import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

filepath = "../../datasets/crypto_genome_master.csv"

# Load dataset
df = pd.read_csv(filepath)

# Separate identifier and features
coin_ids = df["coin_symbol"]
features = df.drop(columns=["coin_symbol"])

# Initialize scaler
scaler = StandardScaler()

# Fit and transform
scaled_features = scaler.fit_transform(features)

# Convert back to DataFrame
scaled_df = pd.DataFrame(scaled_features, columns=features.columns)

# Add back coin_symbol
scaled_df.insert(0, "coin_symbol", coin_ids)

# Save scaled dataset
scaled_df.to_csv("crypto_genome_scaled.csv", index=False)

# Save scaler
joblib.dump(scaler, "../ML/model/scaler.pkl")

print("\n--- SCALING COMPLETE ---")
print("Scaled Shape:", scaled_df.shape)
print("Saved: crypto_genome_scaled.csv")
print("Saved: scaler.pkl")