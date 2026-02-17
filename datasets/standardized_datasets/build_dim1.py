import os
import pandas as pd
import numpy as np

# --- Configuration ---
CURRENT_DIR = os.getcwd()
OUTPUT_FILE = "genome_dim3_drawdown.csv"

genome_data = []
errors = 0

print("Starting Genome Phase 3.4: Building Drawdown Dimension...\n")

for filename in os.listdir(CURRENT_DIR):
    if not filename.endswith('_Canonical.csv'):
        continue
        
    filepath = os.path.join(CURRENT_DIR, filename)
    
    try:
        df = pd.read_csv(filepath)
        symbol = df['coin_symbol'].iloc[0]
        
        # Step 1: Calculate Drawdown Series strictly using 'close'
        close = df['close']
        rolling_max = close.cummax()
        # Formula: (Current - Peak) / Peak. This means all values are <= 0.
        drawdown = (close - rolling_max) / rolling_max
        
        # --- CALCULATING THE 4 DRAWDOWN TRAITS ---
        
        # 1. Max Drawdown (Worst peak-to-trough drop)
        trait_1_max_dd = drawdown.min()
        
        # 2. Average Drawdown Depth (Mean of all drawdown values over history)
        trait_2_avg_dd = drawdown.mean()
        
        # 3. Average Drawdown Duration
        # Count consecutive days where the coin is underwater (drawdown < 0)
        is_in_dd = drawdown < 0
        dd_groups = (is_in_dd != is_in_dd.shift()).cumsum()
        dd_lengths = is_in_dd.groupby(dd_groups).sum()
        dd_lengths = dd_lengths[dd_lengths > 0]
        
        trait_3_avg_duration = dd_lengths.mean() if not dd_lengths.empty else 0
        
        # 4. Recovery Speed Ratio (Days to recover 50% of a major drawdown)
        recovery_days_list = []
        
        # Iterate through each isolated drawdown period
        for _, group_indices in is_in_dd[is_in_dd].groupby(dd_groups):
            period_dd = drawdown.loc[group_indices.index]
            period_worst_dd = period_dd.min()
            
            # We define a "major" drawdown as worse than -20%
            if period_worst_dd <= -0.20:
                trough_idx = period_dd.idxmin()
                trough_price = close.loc[trough_idx]
                peak_price = rolling_max.loc[trough_idx]
                
                # Target price to achieve exactly 50% recovery
                target_price = trough_price + 0.5 * (peak_price - trough_price)
                
                # Look at all prices AFTER the trough
                future_prices = close.loc[trough_idx:]
                recovery_mask = future_prices >= target_price
                
                # If it successfully recovered 50%, calculate how many days it took
                if recovery_mask.any():
                    recovery_idx = recovery_mask.idxmax()
                    days_to_recover = recovery_idx - trough_idx
                    recovery_days_list.append(days_to_recover)
                    
        # Package the Recovery Speed trait based on its historical performance
        if len(recovery_days_list) > 0:
            trait_4_recovery_speed = np.mean(recovery_days_list)
        elif trait_1_max_dd <= -0.20:
            # It had a major drawdown but NEVER recovered 50% (Chronic Bleeder / Dead coin)
            # We penalize it with the maximum possible duration (length of the dataset)
            trait_4_recovery_speed = len(close) 
        else:
            # It never had a major drawdown (e.g., Stablecoins)
            trait_4_recovery_speed = 0 
            
        # Step 3: Package into our Genome Vector
        genome_data.append({
            'coin_symbol': symbol,
            'max_drawdown': trait_1_max_dd,
            'avg_drawdown_depth': trait_2_avg_dd,
            'avg_drawdown_duration': trait_3_avg_duration,
            'recovery_speed_ratio': trait_4_recovery_speed
        })
        
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        errors += 1

# Convert to DataFrame and Save
genome_df = pd.DataFrame(genome_data)
genome_df.to_csv(OUTPUT_FILE, index=False)

# --- Final Output ---
print("-" * 50)
print(" DIMENSION 3: DRAWDOWN COMPLETE")
print("-" * 50)
print(f"Successfully Processed : {len(genome_df)} coins")
print(f"Errors                 : {errors}")
print(f"Output Matrix Shape    : {genome_df.shape} (Rows = Coins, Columns = Traits)")
print(f"Saved Master File to   : {OUTPUT_FILE}")
print("-" * 50)