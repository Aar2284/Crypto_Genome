import pandas as pd

# Load data
genome = pd.read_csv("../../datasets/crypto_genome_master.csv")
clusters = pd.read_csv("../Clustering (GMM)/genome_clusters.csv")

# Merge
df = genome.merge(clusters, on="coin_symbol")

# Group by cluster
cluster_summary = df.groupby("cluster_id").mean(numeric_only=True)

print("\n--- CLUSTER SUMMARY ---")
print(cluster_summary)

# Save
cluster_summary.to_csv("cluster_summary.csv")
print("\nSaved: cluster_summary.csv")

# Interpreted Cluster
label_map = {
    0: "High-Risk Independents",
    1: "Core Market",
    2: "Anomalous Outliers",
    3: "Speculative Rockets",
    4: "Market Followers"
}

df["cluster_label"] = df["cluster_id"].map(label_map)

df[["coin_symbol", "cluster_id", "cluster_label"]].to_csv(
    "genome_clusters_labeled.csv", index=False
)

print("\nSaved: genome_clusters_labeled.csv")