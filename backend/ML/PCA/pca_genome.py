import pandas as pd
from sklearn.decomposition import PCA

# Load scaled data
df = pd.read_csv("../../Scaling/crypto_genome_scaled.csv")

# Separate columns
coin_ids = df["coin_symbol"]
features = df.drop(columns=["coin_symbol"])

# Apply PCA
pca = PCA(n_components=5)
pca_result = pca.fit_transform(features)

# Convert to DataFrame
pca_df = pd.DataFrame(pca_result, columns=[
    "PC1", "PC2", "PC3", "PC4", "PC5"
])

# Add coin symbol
pca_df.insert(0, "coin_symbol", coin_ids)

# Save output
pca_df.to_csv("genome_pca.csv", index=False)

# Print variance explained
print("\n--- PCA COMPLETE ---")
print("Output Shape:", pca_df.shape)
print("\nExplained Variance Ratio:")
print(pca.explained_variance_ratio_)