import pandas as pd
import hdbscan

# Load scaled data
df = pd.read_csv("../processing/crypto_genome_scaled.csv")

coin_ids = df["coin_symbol"]
features = df.drop(columns=["coin_symbol"])

# Apply HDBSCAN
clusterer = hdbscan.HDBSCAN(min_cluster_size=5)
clusters = clusterer.fit_predict(features)

# Output
cluster_df = pd.DataFrame({
    "coin_symbol": coin_ids,
    "cluster_id": clusters
})

cluster_df.to_csv("genome_clusters.csv", index=False)

print("\n--- HDBSCAN COMPLETE ---")
print("Output Shape:", cluster_df.shape)

print("\nCluster Counts:")
print(cluster_df["cluster_id"].value_counts())