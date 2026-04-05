import pandas as pd
from sklearn.mixture import GaussianMixture

# Load scaled data
df = pd.read_csv("../processing/crypto_genome_scaled.csv")

coin_ids = df["coin_symbol"]
features = df.drop(columns=["coin_symbol"])

# Apply GMM
gmm = GaussianMixture(
    n_components=5,       # number of clusters
    covariance_type='full',
    random_state=42
)

gmm.fit(features)
clusters = gmm.predict(features)

# Output
cluster_df = pd.DataFrame({
    "coin_symbol": coin_ids,
    "cluster_id": clusters
})

cluster_df.to_csv("genome_clusters.csv", index=False)

print("\n--- GMM CLUSTERING COMPLETE ---")
print("Output Shape:", cluster_df.shape)

print("\nCluster Counts:")
print(cluster_df["cluster_id"].value_counts())