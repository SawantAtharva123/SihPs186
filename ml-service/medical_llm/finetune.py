"""Fine-tuning pipeline for Qwen2.5-0.5B-Instruct on military clinical doctor reports.

Uses parameter-efficient fine-tuning (LoRA / PEFT) to adapt Qwen2.5-0.5B
to extract structured clinical stress metrics from free-form doctor notes.
"""

import argparse
import json
import os
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune Qwen 0.5B on military medical reports.")
    parser.add_argument(
        "--model_name_or_path",
        type=str,
        default="Qwen/Qwen2.5-0.5B-Instruct",
        help="Base Hugging Face model identifier (default: Qwen/Qwen2.5-0.5B-Instruct)"
    )
    parser.add_argument(
        "--data_dir",
        type=str,
        default=str(Path(__file__).parent / "data"),
        help="Directory containing clinical_train.jsonl and clinical_eval.jsonl"
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default=str(Path(__file__).parent / "checkpoints" / "qwen-military-clinical-lora"),
        help="Path where adapter weights will be saved"
    )
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Per-device train batch size")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--lora_r", type=int, default=8, help="LoRA rank")
    parser.add_argument("--lora_alpha", type=int, default=16, help="LoRA alpha")
    parser.add_argument("--dry_run", action="store_true", help="Validate data and setup without running full training")
    return parser.parse_args()


def load_jsonl_messages(file_path: str) -> list[dict]:
    data = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data


def run_finetune(args):
    print("=" * 60)
    print(f" SAHAYAK Clinical Fine-Tuning: {args.model_name_or_path}")
    print("=" * 60)
    
    # 1. Ensure dataset exists
    train_file = os.path.join(args.data_dir, "clinical_train.jsonl")
    eval_file = os.path.join(args.data_dir, "clinical_eval.jsonl")
    
    if not os.path.exists(train_file):
        print(f"Dataset not found at {train_file}. Generating synthetic tactical dataset...")
        from medical_llm.dataset_generator import create_training_dataset
        create_training_dataset(output_dir=args.data_dir)
        
    train_records = load_jsonl_messages(train_file)
    eval_records = load_jsonl_messages(eval_file) if os.path.exists(eval_file) else []
    print(f"Loaded {len(train_records)} training records, {len(eval_records)} evaluation records.")
    
    if args.dry_run:
        print("[Dry Run] Sample conversation format:")
        print(json.dumps(train_records[0], indent=2))
        print("\n[Dry Run] Configuration and dataset validated successfully. Exiting.")
        return

    try:
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            TrainingArguments,
            Trainer,
            DataCollatorForSeq2Seq
        )
    except ImportError as e:
        print(f"Error importing PyTorch / Transformers: {e}")
        print("Please ensure torch and transformers are installed.")
        return

    # Check for PEFT
    try:
        from peft import LoraConfig, get_peft_model, TaskType
    except ImportError:
        print("Warning: 'peft' package not installed. Installing peft recommended for LoRA.")
        LoraConfig = None

    print(f"Loading tokenizer: {args.model_name_or_path}...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name_or_path, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print(f"Loading base model: {args.model_name_or_path}...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using compute device: {device}")
    
    model = AutoModelForCausalLM.from_pretrained(
        args.model_name_or_path,
        torch_dtype=torch.float32 if device == "cpu" else torch.float16,
        trust_remote_code=True
    )
    
    # Apply LoRA if available
    if LoraConfig is not None:
        peft_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=args.lora_r,
            lora_alpha=args.lora_alpha,
            lora_dropout=0.05,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj"]
        )
        model = get_peft_model(model, peft_config)
        model.print_trainable_parameters()
    else:
        print("Training full parameters (no PEFT).")

    # Format texts using tokenizer chat template
    def tokenize_function(records):
        inputs = []
        for rec in records:
            text = tokenizer.apply_chat_template(
                rec["messages"],
                tokenize=False,
                add_generation_prompt=False
            )
            inputs.append(text)
        
        tokenized = tokenizer(
            inputs,
            padding="max_length",
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )
        tokenized["labels"] = tokenized["input_ids"].clone()
        return tokenized

    print("Tokenizing training dataset...")
    # Wrap in custom PyTorch Dataset
    class ClinicalDataset(torch.utils.data.Dataset):
        def __init__(self, records):
            self.data = records
            
        def __len__(self):
            return len(self.data)
            
        def __getitem__(self, idx):
            rec = self.data[idx]
            text = tokenizer.apply_chat_template(
                rec["messages"],
                tokenize=False,
                add_generation_prompt=False
            )
            item = tokenizer(
                text,
                padding="max_length",
                truncation=True,
                max_length=512,
                return_tensors="pt"
            )
            return {
                "input_ids": item["input_ids"].squeeze(0),
                "attention_mask": item["attention_mask"].squeeze(0),
                "labels": item["input_ids"].squeeze(0)
            }

    train_dataset = ClinicalDataset(train_records)
    eval_dataset = ClinicalDataset(eval_records) if eval_records else None

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        learning_rate=args.lr,
        logging_steps=1,
        save_strategy="epoch",
        evaluation_strategy="no",
        save_total_limit=1,
        fp16=(device == "cuda"),
        use_cpu=(device == "cpu"),
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset
    )

    print("Starting fine-tuning...")
    trainer.train()

    print(f"Saving fine-tuned model and adapter weights to {args.output_dir}...")
    os.makedirs(args.output_dir, exist_ok=True)
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print("Fine-tuning completed successfully!")


if __name__ == "__main__":
    args = parse_args()
    run_finetune(args)
