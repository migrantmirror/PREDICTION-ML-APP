"""
🚀 CLICK THE RUN BUTTON ABOVE TO EXECUTE THIS ML TRAINING SCRIPT! 🚀

Advanced Football Prediction ML Training Script
This demonstrates how to train a machine learning model for football predictions
using the features we've implemented in the web application.

Features included:
- ELO rating system
- Weighted form analysis  
- Expected goals (xG) modeling
- Player availability impact
- Venue and motivation factors
- Market confidence indicators

The script will:
1. Generate 5000 synthetic training samples
2. Train a Random Forest classifier
3. Show model accuracy and feature importance
4. Save the trained model as 'football_prediction_model.pkl'
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Simulate training data (in production, this would come from your database)
def generate_training_data(n_samples=1000):
    """Generate synthetic training data for demonstration"""
    np.random.seed(42)
    
    data = []
    for i in range(n_samples):
        # Generate features similar to our MLFeatures interface
        home_elo = np.random.normal(1500, 200)
        away_elo = np.random.normal(1500, 200)
        
        # ELO difference influences outcome
        elo_diff = home_elo - away_elo
        
        features = {
            'home_team_elo': home_elo,
            'away_team_elo': away_elo,
            'elo_difference': elo_diff,
            'home_form_weighted': np.random.uniform(0, 1),
            'away_form_weighted': np.random.uniform(0, 1),
            'h2h_win_rate': np.random.uniform(0, 1),
            'home_xg_diff': np.random.normal(0, 0.5),
            'away_xg_diff': np.random.normal(0, 0.5),
            'home_attack_strength': np.random.uniform(0.5, 2.0),
            'away_attack_strength': np.random.uniform(0.5, 2.0),
            'home_defense_strength': np.random.uniform(0.5, 2.0),
            'away_defense_strength': np.random.uniform(0.5, 2.0),
            'home_key_players_score': np.random.uniform(0, 1),
            'away_key_players_score': np.random.uniform(0, 1),
            'venue_advantage': np.random.uniform(0, 0.3),
            'motivation_differential': np.random.uniform(-0.5, 0.5),
            'market_confidence': np.random.uniform(0, 1),
            'league_competitiveness': np.random.uniform(0.6, 1.0),
            'season_stage': np.random.uniform(0, 1),
        }
        
        # Generate outcome based on features (simplified logic)
        home_prob = 0.33 + (elo_diff / 1000) * 0.2
        home_prob += features['home_form_weighted'] * 0.1
        home_prob += features['venue_advantage'] * 0.15
        home_prob += features['motivation_differential'] * 0.05
        
        # Ensure probabilities are valid
        home_prob = max(0.1, min(0.8, home_prob))
        away_prob = 0.33 + np.random.uniform(-0.1, 0.1)
        draw_prob = 1 - home_prob - away_prob
        
        # Determine outcome (0=Home Win, 1=Draw, 2=Away Win)
        outcome_probs = [home_prob, draw_prob, away_prob]
        outcome = np.random.choice([0, 1, 2], p=outcome_probs)
        
        features['outcome'] = outcome
        data.append(features)
    
    return pd.DataFrame(data)

def train_prediction_model():
    """Train the football prediction model"""
    print("🏈 Generating training data...")
    df = generate_training_data(5000)
    
    # Prepare features and target
    feature_columns = [col for col in df.columns if col != 'outcome']
    X = df[feature_columns]
    y = df['outcome']
    
    print(f"📊 Training on {len(df)} matches with {len(feature_columns)} features")
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Random Forest model
    print("🌳 Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_accuracy = accuracy_score(y_train, train_pred)
    test_accuracy = accuracy_score(y_test, test_pred)
    
    print(f"✅ Training Accuracy: {train_accuracy:.3f}")
    print(f"✅ Test Accuracy: {test_accuracy:.3f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🎯 Top 10 Most Important Features:")
    print(feature_importance.head(10).to_string(index=False))
    
    # Classification report
    print("\n📈 Classification Report:")
    print(classification_report(y_test, test_pred, 
                              target_names=['Home Win', 'Draw', 'Away Win']))
    
    # Save model
    joblib.dump(model, 'football_prediction_model.pkl')
    print("\n💾 Model saved as 'football_prediction_model.pkl'")
    
    return model, feature_columns

def predict_match_outcome(model, feature_columns, match_features):
    """Predict outcome for a single match"""
    # Convert features to DataFrame
    features_df = pd.DataFrame([match_features])
    
    # Ensure all required columns are present
    for col in feature_columns:
        if col not in features_df.columns:
            features_df[col] = 0
    
    # Reorder columns to match training data
    features_df = features_df[feature_columns]
    
    # Get prediction probabilities
    probabilities = model.predict_proba(features_df)[0]
    prediction = model.predict(features_df)[0]
    
    outcome_labels = ['Home Win', 'Draw', 'Away Win']
    
    return {
        'prediction': outcome_labels[prediction],
        'probabilities': {
            'home_win': probabilities[0],
            'draw': probabilities[1],
            'away_win': probabilities[2]
        },
        'confidence': max(probabilities) * 100
    }

# Example usage
if __name__ == "__main__":
    print("🚀 Starting Football Prediction ML Training...")
    
    # Train the model
    model, feature_columns = train_prediction_model()
    
    # Example prediction
    print("\n🔮 Example Prediction:")
    example_match = {
        'home_team_elo': 1650,
        'away_team_elo': 1580,
        'elo_difference': 70,
        'home_form_weighted': 0.8,
        'away_form_weighted': 0.6,
        'h2h_win_rate': 0.6,
        'home_xg_diff': 0.3,
        'away_xg_diff': -0.1,
        'home_attack_strength': 1.2,
        'away_attack_strength': 0.9,
        'home_defense_strength': 1.1,
        'away_defense_strength': 0.8,
        'home_key_players_score': 0.9,
        'away_key_players_score': 0.7,
        'venue_advantage': 0.15,
        'motivation_differential': 0.1,
        'market_confidence': 0.7,
        'league_competitiveness': 0.85,
        'season_stage': 0.6,
    }
    
    result = predict_match_outcome(model, feature_columns, example_match)
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.1f}%")
    print("Probabilities:")
    for outcome, prob in result['probabilities'].items():
        print(f"  {outcome}: {prob:.3f} ({prob*100:.1f}%)")
    
    print("\n✨ Training completed successfully!")
