import pandas as pd
from sklearn.cluster import KMeans

# Load scaled data
df = pd.read_csv("../processing/crypto_genome_scaled.csv")

coin_ids = df["coin_symbol"]
features = df.drop(columns=["coin_symbol"])

# Apply KMeans
kmeans = KMeans(n_clusters=5, random_state=42)
clusters = kmeans.fit_predict(features)

# Create output
cluster_df = pd.DataFrame({
    "coin_symbol": coin_ids,
    "cluster_id": clusters
})

# Save
cluster_df.to_csv("genome_clusters.csv", index=False)

print("\n--- CLUSTERING COMPLETE ---")
print("Output Shape:", cluster_df.shape)
print("\nCluster Counts:")
print(cluster_df["cluster_id"].value_counts())