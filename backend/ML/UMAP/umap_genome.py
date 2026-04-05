import pandas as pd
import umap 

# Load scaled data
df = pd.read_csv("../Scaling/crypto_genome_scaled.csv")

# Separate columns
coin_ids = df["coin_symbol"]
features = df.drop(columns=["coin_symbol"])

# Apply UMAP
umap_model = umap.UMAP(
    n_components=2,
    n_neighbors=10,
    min_dist=0.1,
    random_state=42
)

umap_result = umap_model.fit_transform(features)

# Convert to DataFrame
umap_df = pd.DataFrame(umap_result, columns=["UMAP1", "UMAP2"])

# Add coin symbol
umap_df.insert(0, "coin_symbol", coin_ids)

# Save output
umap_df.to_csv("genome_umap.csv", index=False)

print("\n--- UMAP COMPLETE ---")
print("Output Shape:", umap_df.shape)